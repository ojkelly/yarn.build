import {
  Configuration,
  Manifest,
  Project,
  StreamReport,
  Workspace,
  FormatType,
} from "@yarnpkg/core";
import isCI from "is-ci";
import { cpus } from "os";
import { PortablePath, NodeFS } from "@yarnpkg/fslib";

import { EventEmitter } from "events";
import PQueue from "p-queue";
import path from "path";
import PLimit, { Limit } from "p-limit";
import { Mutex } from "await-semaphore";
import fs from "fs";
import stripAnsi from "strip-ansi";
import readline from "readline";
import { Graph, Node } from "./graph";

type BuildPlan = {
  workspace: Workspace;
  dependencies: [BuildPlan | void];
};

enum BuildStatus {
  pending = "pending",
  inProgress = "inProgress",
  failed = "failed",
  succeeded = "succeeded",
}
type BuildLogFile = {
  comment: string;
  packages: {
    [relativePath: string]: BuildLogEntry;
  };
};
type BuildLog = Map<string, BuildLogEntry>;
type BuildLogEntry = {
  lastModified?: number;
  status?: BuildStatus;
  rebuild?: boolean;
  haveCheckedForRebuild?: boolean;
};

enum BuildReporterEvents {
  pending = "pending",
  start = "start",
  info = "info",
  error = "error",
  success = "success",
  fail = "fail",
  finish = "finish",
}

type BuildReport = {
  mutex: Mutex;
  buildStart?: number;
  totalJobs: number;
  previousOutputNumLines: number;
  successCount: number;
  failCount: number;
  done: boolean;
  workspaces: {
    // Matches the workspace to its pseudo-thread
    [relativeCwd: string]: {
      start?: number;
      name: string;
      buildScript?: string;
      done: boolean;
      fail: boolean;
      stdout: string[];
      stderr: Error[];
    };
  };
};

type BuildCommandCli = (
  command: string,
  cwd: PortablePath,
  buildReporter: EventEmitter,
  prefix: string
) => Promise<number>;

class BuildSupervisor {
  project: Project;
  configuration: Configuration;
  report: StreamReport;

  buildCommand: string;
  cli: BuildCommandCli;

  buildLog?: BuildLog;
  buildGraph = new Graph();
  buildLength = 0;
  buildTargets: Workspace[] = [];
  buildMutexes: { [relativCwd: string]: Mutex } = {};
  currentBuildTarget?: string;
  dryRun = false;
  verbose = false;
  queue: PQueue;

  entrypoints: Node[] = [];

  limit: Limit = PLimit(Math.max(1, cpus().length));

  buildReporter: EventEmitter = new EventEmitter();
  buildReport: BuildReport = {
    mutex: new Mutex(),
    totalJobs: 0,
    previousOutputNumLines: 0,
    successCount: 0,
    failCount: 0,
    workspaces: {},
    done: false,
  };

  concurrency = Math.max(1, cpus().length);

  nextUnitOfWork: Promise<void>[] = [];

  errorLogFile: fs.WriteStream;

  private hasSetup = false;

  constructor({
    project,
    report,
    buildCommand,
    cli,
    configuration,
    dryRun,
    verbose,
  }: {
    project: Project;
    report: StreamReport;
    buildCommand: string;
    cli: BuildCommandCli;
    configuration: Configuration;
    dryRun: boolean;
    verbose: boolean;
  }) {
    this.configuration = configuration;
    this.project = project;
    this.report = report;
    this.buildCommand = buildCommand;
    this.cli = cli;
    this.dryRun = dryRun;
    this.verbose = verbose;

    this.queue = new PQueue({
      concurrency: this.concurrency, // TODO: make this customisable
      carryoverConcurrencyCount: true,
      timeout: 50000, // TODO: make this customisable
      throwOnTimeout: true,
      autoStart: true,
    });
    this.errorLogFile = fs.createWriteStream(
      `${this.project.cwd}${path.sep}build-error.log`,
      {
        flags: "a",
      }
    );
  }

  async setup() {
    this.buildLog = await this.readBuildLog();
    this.setupBuildReporter();

    this.hasSetup = true;
  }

  private getBuildLogPath(): string {
    return `${this.project.cwd}${path.sep}.yarn${path.sep}local-build-cache.json`;
  }
  private async readBuildLog(): Promise<BuildLog> {
    const buildLog = new Map<string, BuildLogEntry>();

    try {
      const buildLogFile: BuildLogFile = await new Promise(
        (resolve, reject) => {
          fs.readFile(this.getBuildLogPath(), function (err, buf) {
            if (err) {
              reject();
            }
            if (buf) {
              try {
                const parsed = JSON.parse(buf.toString());
                resolve(parsed);
              } catch (e) {
                reject(e);
              }
            }
          });
        }
      );

      if (buildLogFile && buildLogFile.packages) {
        for (const id in buildLogFile.packages) {
          buildLog.set(id, {
            lastModified: buildLogFile.packages[id].lastModified,
            status: buildLogFile.packages[id].status,
            haveCheckedForRebuild: false,
            rebuild: true,
          });
        }
      }
    } catch {}

    return buildLog;
  }

  private async saveBuildLog() {
    if (!this.buildLog) {
      return;
    }
    const buildLogFile: BuildLogFile = {
      comment:
        "This is an auto-generated file," +
        " it keeps track of whats been built." +
        " This is a local file, don't store this in version control.",
      packages: {},
    };

    for (const [id, entry] of this.buildLog) {
      if (entry.status !== BuildStatus.succeeded) {
        continue;
      }

      buildLogFile.packages[id] = {
        lastModified: entry.lastModified,
      };
    }

    fs.writeFileSync(
      this.getBuildLogPath(),
      JSON.stringify(buildLogFile, null, 2)
    );
  }

  logError(s: string) {
    // if ci print to stderr
    this.errorLogFile.write("➤ YN0009: " + stripAnsi(s) + "\n");
  }

  setupBuildReporter = () => {
    this.buildReporter.on(
      BuildReporterEvents.pending,
      (relativeCwd: PortablePath, name: string) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd] = {
            name,
            stdout: [],
            stderr: [],
            done: false,
            fail: false,
          };
          release();
        });
      }
    );

    this.buildReporter.on(
      BuildReporterEvents.start,
      (relativeCwd: PortablePath, name: string, buildScript: string) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd] = {
            ...this.buildReport.workspaces[relativeCwd],
            start: Date.now(),
            buildScript,
            name,
          };
          release();
        });
      }
    );

    this.buildReporter.on(
      BuildReporterEvents.info,
      (relativeCwd: PortablePath, message: string) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd].stdout.push(message);
          release();
        });
      }
    );

    this.buildReporter.on(
      BuildReporterEvents.error,
      (relativeCwd: PortablePath, error: Error) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd].stderr.push(error);
          this.logError(`${relativeCwd} ${error}`);

          release();
        });
      }
    );

    this.buildReporter.on(
      BuildReporterEvents.success,
      (relativeCwd: PortablePath) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd] = {
            ...this.buildReport.workspaces[relativeCwd],
            done: true,
          };

          this.buildReport.successCount++;
          release();
        });
      }
    );

    this.buildReporter.on(
      BuildReporterEvents.fail,
      (relativeCwd: PortablePath, error: Error) => {
        this.buildReport.mutex.acquire().then((release: () => void) => {
          this.buildReport.workspaces[relativeCwd].stderr.push(error);

          this.buildReport.workspaces[relativeCwd].done = true;
          this.buildReport.workspaces[relativeCwd].fail = true;

          this.buildReport.failCount++;

          this.logError(`${relativeCwd} ${error}`);

          // TODO: if fail immediately
          // this.buildReporter.emit(BuildReporterEvents.finish);
          release();
        });
      }
    );

    // this.buildReporter.on(BuildReporterEvents.finish, () => {});
  };

  async addBuildTarget(workspace: Workspace) {
    this.entrypoints.push(this.buildGraph.addNode(workspace.relativeCwd));
    const build = await this.plan(workspace);

    if (build) {
      this.buildTargets.push(workspace);
    }
  }

  plan = async (workspace: Workspace): Promise<boolean> => {
    const parent = this.buildGraph
      .addNode(workspace.relativeCwd)
      .addWorkSpace(workspace);

    let rebuildParent = false;

    this.buildMutexes[workspace.relativeCwd] = new Mutex();

    for (const dependencyType of Manifest.hardDependencies) {
      for (const descriptor of workspace.manifest
        .getForScope(dependencyType)
        .values()) {
        const depWorkspace = this.project.tryWorkspaceByDescriptor(descriptor);

        if (depWorkspace === null) continue;

        const dep = this.buildGraph
          .addNode(depWorkspace.relativeCwd)
          .addWorkSpace(depWorkspace);

        parent.addDependency(dep);

        const depsOfDepsNeedRebuild = await this.plan(depWorkspace);

        let depNeedsBuild = false;
        if (depWorkspace !== this.project.topLevelWorkspace) {
          depNeedsBuild = await this.checkIfBuildIsRequired(depWorkspace);
        }

        if (depNeedsBuild || depsOfDepsNeedRebuild) {
          rebuildParent = true;
          dep.addBuildCallback(this.build(depWorkspace));
        }
      }
    }
    let hasChanges = false;
    if (workspace !== this.project.topLevelWorkspace) {
      hasChanges = await this.checkIfBuildIsRequired(workspace);
    }
    this.buildReporter.emit(BuildReporterEvents.pending, workspace.relativeCwd);
    if (rebuildParent || hasChanges) {
      this.buildReporter.emit(
        BuildReporterEvents.pending,
        workspace.relativeCwd,
        `${
          workspace.manifest.name?.scope
            ? `@${workspace.manifest.name?.scope}/`
            : ""
        }${workspace.manifest.name?.name}`
      );
      parent.addBuildCallback(this.build(workspace));
      return true;
    }

    return false;
  };

  private async checkIfBuildIsRequired(workspace: Workspace): Promise<boolean> {
    let needsBuild = false;
    const dir: PortablePath = path.resolve(
      `${workspace.project.cwd}${path.sep}${workspace.relativeCwd}`
    ) as PortablePath;

    let ignore = undefined;

    if (workspace?.manifest.raw.main) {
      // TODO: could this be improved?
      ignore = `${dir}${path.sep}${
        workspace?.manifest.raw.main.substring(
          0,
          workspace?.manifest.raw.main.lastIndexOf(path.sep)
        ) as PortablePath
      }` as PortablePath;
    }

    const release = await this.buildReport.mutex.acquire();
    try {
      const previousBuildLog = this.buildLog?.get(workspace.relativeCwd);

      if (previousBuildLog?.haveCheckedForRebuild) {
        return previousBuildLog?.rebuild ?? true;
      }
      const currentLastModified = await getLastModifiedForFolder(dir, ignore);

      if (previousBuildLog?.lastModified !== currentLastModified) {
        needsBuild = true;
      }

      this.buildLog?.set(workspace.relativeCwd, {
        lastModified: currentLastModified,
        status: needsBuild ? BuildStatus.succeeded : BuildStatus.pending,
        haveCheckedForRebuild: true,
        rebuild: needsBuild,
      });
      // if (needsBuild) {
      //   this.buildReporter.emit(
      //     BuildReporterEvents.success,
      //     workspace.relativeCwd
      //   );
      // } else {

      // }
    } catch (e) {
      this.logError(
        `${workspace.relativeCwd}: failed to get lastModified (${e})`
      );
    } finally {
      release();
    }

    return needsBuild;
  }

  run = async () => {
    if (this.hasSetup === false) {
      throw new Error(
        "BuildSupervisor is not setup, you need to call await supervisor.setup()"
      );
    }

    this.buildReport.buildStart = Date.now();

    // Print our buildReporter output
    if (!this.dryRun && !isCI) {
      this.raf(this.waitUntilDone);
    }

    if (this.dryRun) {
      return;
    }

    this.currentBuildTarget =
      this.buildTargets.length > 1
        ? "All"
        : this.buildTargets[0]?.relativeCwd ?? "Nothing to build";

    const header = this.generateHeaderString();

    // build
    await this.buildGraph.build(this.entrypoints);

    const release = await this.buildReport.mutex.acquire();

    this.buildReport.done = true;

    release();

    if (!isCI) {
      // Cleanup the processing lines
      readline.moveCursor(
        process.stdout,
        0,
        -this.buildReport.previousOutputNumLines
      );
      readline.clearScreenDown(process.stdout);
      process.stdout.cursorTo(0);
    }

    // Check if there were errors, and print them out
    if (this.buildReport.failCount !== 0) {
      this.logError(header);
      process.stdout.write(header + "\n");
      // print out any build errors
      for (const relativePath in this.buildReport.workspaces) {
        const workspace = this.buildReport.workspaces[relativePath];

        if (workspace.stdout.length !== 0) {
          const lineHeader = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ ┌ Errors for ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineHeader);
          process.stdout.write(lineHeader + "\n");

          workspace.stdout.forEach((m) => {
            const lines = m.split("\n");

            lines.forEach((line, i) => {
              if (line.length !== 0) {
                const formattedLine = `${this.configuration.format(
                  `➤`,
                  `blueBright`
                )} YN0009: │ ${lines.length === i - 1 ? "└" : "│"} ${line}`;
                this.logError(formattedLine);
                process.stdout.write(formattedLine + "\n");
              }
            });
          });

          const lineTail = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ └ End ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineTail);
          process.stdout.write(lineTail + "\n");
        }

        if (workspace.stderr.length !== 0) {
          // stderr doesnt seem to be useful for showing to the user in cli
          // we'll still write it out to the build log
          const lineHeader = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ ┌ Errors ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineHeader);
          // process.stderr.write(lineHeader + "\n");

          workspace.stderr.forEach((e) => {
            const err = e instanceof Error ? e.toString() : `${e}`;
            const lines = err.split("\n");
            lines.forEach((line, i) => {
              if (line.length !== 0) {
                const formattedLine = `${this.configuration.format(
                  `➤`,
                  `blueBright`
                )} YN0009: │ ${lines.length === i - 1 ? "└" : "│"} ${line}`;

                this.logError(formattedLine);
                // process.stderr.write(formattedLine + "\n");
              }
            });
          });

          const lineTail = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ └ Errors ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineTail);
          // process.stderr.write(lineTail + "\n");
        }
      }
    }

    const finalLine = this.generateFinalReport();

    process.stdout.write(finalLine);
    this.logError(finalLine);

    // commit the build log
    await this.saveBuildLog();

    return this.buildReport.failCount === 0;
  };

  // This is a very simple requestAnimationFrame polyfil
  raf = (f: (timestamp: number) => void) => {
    setImmediate(() => f(Date.now()));
  };

  waitUntilDone = (timestamp: number) => {
    if (this.buildReport.done) {
      return;
    }

    readline.moveCursor(
      process.stdout,
      0,
      -this.buildReport.previousOutputNumLines
    );
    readline.clearScreenDown(process.stdout);
    process.stdout.cursorTo(0);

    const output = this.generateProgressString(timestamp);

    process.stdout.write(output);

    this.buildReport.previousOutputNumLines = (
      output.match(/\n/g) || []
    ).length;

    delay(70).then(() => {
      this.raf(this.waitUntilDone);
    });
  };

  generateHeaderString(): string {
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = this.configuration.format(`YN0000:`, `grey`);

    return `${arrow} ${code} ┌ ${this.configuration.format(
      `Building`,
      `grey`
    )} ${this.configuration.format(
      this.currentBuildTarget ? this.currentBuildTarget : "",
      FormatType.SCOPE
    )}${
      this.dryRun
        ? this.configuration.format(` --dry-run`, FormatType.NAME)
        : ""
    }`;
  }

  generateProgressString(timestamp: number): string {
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = this.configuration.format(`YN0000:`, `grey`);
    const prefix = `${arrow} ${code} │`;

    let output = "";

    const indexString = (s: number) =>
      this.configuration.format(`[${s}]`, `grey`);
    const referenceString = (s: string) =>
      this.configuration.format(`${s}`, FormatType.NAME);
    const idleString = this.configuration.format(`IDLE`, `grey`);

    output += this.generateHeaderString() + "\n";

    let i = 1;

    for (const relativePath in this.buildReport.workspaces) {
      const thread = this.buildReport.workspaces[relativePath];
      if (!thread || !thread.start || thread.done) {
        continue;
      }

      const pathString = this.configuration.format(
        relativePath,
        FormatType.PATH
      );

      const buildScriptString = this.configuration.format(
        `(${thread.buildScript})`,
        FormatType.REFERENCE
      );

      const timeString = thread.start
        ? this.configuration.format(
            formatTimestampDifference(thread.start, timestamp),
            FormatType.RANGE
          )
        : "";

      output += `${prefix} ${indexString(i++)} ${pathString}${referenceString(
        thread.name
      )} ${buildScriptString} ${timeString}\n`;
    }

    for (i; i < this.concurrency + 1; ) {
      output += `${prefix} ${indexString(i++)} ${idleString}\n`;
    }

    if (this.buildReport.buildStart) {
      output += this.generateBuildCountString(timestamp);
    }
    return output;
  }

  generateBuildCountString = (timestamp: number) => {
    const grey = (s: string) => this.configuration.format(s, `grey`);
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = grey(`YN0000:`);

    let output = "";
    if (this.buildReport.buildStart) {
      const successString = this.configuration.format(
        `${this.buildReport.successCount}`,
        "green"
      );
      const failedString = this.configuration.format(
        `${this.buildReport.failCount}`,
        "red"
      );
      const totalString = this.configuration.format(
        `${this.buildGraph.buildSize}`,
        "grey"
      );

      output += `${arrow} ${code} └ ${grey("[")}${successString}${grey(
        ":"
      )}${failedString}${grey("/")}${totalString}${grey(
        "]"
      )} ${formatTimestampDifference(
        this.buildReport.buildStart,
        timestamp
      )}\n`;
    }
    return output;
  };

  generateFinalReport = () => {
    const grey = (s: string) => this.configuration.format(s, `grey`);
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = grey(`YN0000:`);

    let output = `${arrow} ${code} └ Build finished${
      this.buildReport.failCount != 0
        ? this.configuration.format(
            ` with ${this.buildReport.failCount} errors`,
            "red"
          )
        : ""
    }\n`;
    if (this.buildReport.buildStart) {
      const successString = this.configuration.format(
        `${this.buildReport.successCount}`,
        "green"
      );
      const failedString = this.configuration.format(
        `${this.buildReport.failCount}`,
        "red"
      );
      const totalString = this.configuration.format(
        `${this.buildGraph.buildSize}`,
        "grey"
      );

      output += `${arrow} ${code} ${grey("[")}${successString}${grey(
        ":"
      )}${failedString}${grey("/")}${totalString}${grey("]")}\n`;
    }
    return output;
  };

  // Returns a PQueue item
  build = (workspace: Workspace) => {
    return async () =>
      await this.limit(
        async (): Promise<boolean> => {
          const prefix = workspace.relativeCwd;

          const command = workspace.manifest.scripts.get(this.buildCommand);

          const currentBuildLog = this.buildLog?.get(workspace.relativeCwd);

          this.buildReporter.emit(
            BuildReporterEvents.start,
            workspace.relativeCwd,
            `${
              workspace.manifest.name?.scope
                ? `@${workspace.manifest.name?.scope}/`
                : ""
            }${workspace.manifest.name?.name}`,
            command
          );

          if (!command) {
            if (this.verbose) {
              this.buildReporter.emit(
                BuildReporterEvents.info,
                workspace.relativeCwd,
                `Missing \`${this.buildCommand}\` script in manifest.`
              );
            }

            this.buildReporter.emit(
              BuildReporterEvents.success,
              workspace.relativeCwd
            );
            return true;
          }

          try {
            const exitCode = await this.cli(
              command,
              workspace.cwd,
              this.buildReporter,
              prefix
            );

            if (exitCode !== 0) {
              this.buildReporter.emit(
                BuildReporterEvents.fail,
                workspace.relativeCwd
              );

              this.buildLog?.set(workspace.relativeCwd, {
                lastModified: currentBuildLog?.lastModified,
                status: BuildStatus.failed,
                haveCheckedForRebuild: true,
                rebuild: false,
              });

              return false;
            }

            this.buildLog?.set(workspace.relativeCwd, {
              lastModified: currentBuildLog?.lastModified,
              status: BuildStatus.succeeded,
              haveCheckedForRebuild: true,
              rebuild: false,
            });

            this.buildReporter.emit(
              BuildReporterEvents.success,
              workspace.relativeCwd
            );
          } catch (e) {
            this.buildReporter.emit(
              BuildReporterEvents.fail,
              workspace.relativeCwd,
              e
            );

            this.buildLog?.set(workspace.relativeCwd, {
              lastModified: currentBuildLog?.lastModified,
              status: BuildStatus.failed,
              haveCheckedForRebuild: true,
              rebuild: false,
            });

            return false;
          }
          return true;
        }
      );
  };
}

const getLastModifiedForFolder = async (
  folder: PortablePath,
  ignore: PortablePath | undefined
): Promise<number> => {
  // TODO: ignore the folder where the `pkg.main` script resides, or in a
  // `pkg.build.output` is.

  const fs = new NodeFS();
  let lastModified = 0;

  const files = await fs.readdirPromise(folder);

  await Promise.all(
    files.map(async (file) => {
      const filePath = `${folder}${path.sep}${file}` as PortablePath;

      if (ignore && filePath.startsWith(ignore)) {
        return;
      }

      const stat = await fs.statPromise(filePath);
      if (stat.isFile) {
        if (stat.mtimeMs > lastModified) {
          lastModified = stat.mtimeMs;
        }
      }
      if (stat.isDirectory()) {
        const folderLastModified = await getLastModifiedForFolder(
          filePath,
          ignore
        );

        if (folderLastModified > lastModified) {
          lastModified = folderLastModified;
        }
      }
    })
  );

  return lastModified;
};

// TODO: this needs work especially above 1 minute
const formatTimestampDifference = (from: number, to: number): string => {
  const ms = Math.abs(to - from);
  let output = "";

  const s = ms / 1000;
  const m = s / 60;

  if (m > 1) {
    output += `${m}m `;
  }
  output += `${(ms / 1000).toFixed(2)}s`;

  return output;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default BuildSupervisor;

export {
  BuildCommandCli,
  BuildLogEntry as BuildLog,
  BuildPlan,
  BuildReport,
  BuildReporterEvents,
};
