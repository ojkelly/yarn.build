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
import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { YarnBuildConfiguration } from "../../config";

import { EventEmitter } from "events";
import PQueue from "p-queue";
import path from "path";
import PLimit, { Limit } from "p-limit";
import { Mutex } from "await-semaphore";
import fs from "fs";
import stripAnsi from "strip-ansi";
import sliceAnsi from "slice-ansi";
import { Graph, Node } from "./graph";
import {Hansi} from "./hansi";

const YARN_RUN_CACHE_FILENAME = "yarn.build.json" as Filename;

type RunPlan = {
  workspace: Workspace;
  dependencies: [RunPlan | void];
};

enum RunStatus {
  pending = "pending",
  inProgress = "inProgress",
  failed = "failed",
  succeeded = "succeeded",
}
type RunLogFile = {
  comment: string;
  packages: {
    [relativePath: string]: RunLogEntry;
  };
};
type RunLog = Map<string, RunLogEntry>;
type RunLogEntry = {
  lastModified?: number;
  status?: RunStatus;
  rerun?: boolean;
  haveCheckedForRerun?: boolean;
  command: string;
};

enum RunSupervisorReporterEvents {
  pending = "pending",
  start = "start",
  info = "info",
  error = "error",
  success = "success",
  fail = "fail",
  finish = "finish",
}

type RunReport = {
  mutex: Mutex;
  runStart?: number;
  totalJobs: number;
  previousOutput: string;
  successCount: number;
  failCount: number;
  done: boolean;
  workspaces: {
    // Matches the workspace to its pseudo-thread
    [relativeCwd: string]: {
      start?: number;
      name: string;
      runScript?: string;
      done: boolean;
      fail: boolean;
      stdout: string[];
      stderr: Error[];
    };
  };
};

type RunCommandCli = (
  command: string,
  cwd: PortablePath,
  runReporter: EventEmitter,
  prefix: string
) => Promise<number>;

class RunSupervisor {
  project: Project;
  configuration: Configuration;
  pluginConfiguration: YarnBuildConfiguration;
  report: StreamReport;

  runCommand: string;
  cli: RunCommandCli;

  runLog?: RunLog;
  runGraph = new Graph();
  runLength = 0;
  runTargets: Workspace[] = [];
  runMutexes: { [relativCwd: string]: Mutex } = {};
  currentRunTarget?: string;
  dryRun = false;
  ignoreRunCache = false;
  verbose = false;
  queue: PQueue;

  entrypoints: Node[] = [];

  limit: Limit = PLimit(Math.max(1, cpus().length));

  runReporter: EventEmitter = new EventEmitter();
  runReport: RunReport = {
    mutex: new Mutex(),
    totalJobs: 0,
    previousOutput:``,
    successCount: 0,
    failCount: 0,
    workspaces: {},
    done: false,
  };

  concurrency = Math.max(1, cpus().length);

  nextUnitOfWork: Promise<void>[] = [];

  errorLogFile: fs.WriteStream | undefined;

  private hasSetup = false;

  constructor({
    project,
    report,
    runCommand,
    cli,
    configuration,
    pluginConfiguration,
    dryRun,
    ignoreRunCache,
    verbose,
  }: {
    project: Project;
    report: StreamReport;
    runCommand: string;
    cli: RunCommandCli;
    configuration: Configuration;
    pluginConfiguration: YarnBuildConfiguration;
    dryRun: boolean;
    ignoreRunCache: boolean;
    verbose: boolean;
  }) {
    this.configuration = configuration;
    this.pluginConfiguration = pluginConfiguration;
    this.project = project;
    this.report = report;
    this.runCommand = runCommand;
    this.cli = cli;
    this.dryRun = dryRun;
    this.ignoreRunCache = ignoreRunCache;
    this.verbose = verbose;

    this.queue = new PQueue({
      concurrency: this.concurrency, // TODO: make this customisable
      carryoverConcurrencyCount: true,
      timeout: 50000, // TODO: make this customisable
      throwOnTimeout: true,
      autoStart: true,
    });
    if (this.verbose) {
      this.errorLogFile = xfs.createWriteStream(this.getRunErrorPath(), {
        flags: "a",
      });
    }
  }

  async setup() {
    this.runLog = await this.readRunLog();
    this.setupRunReporter();

    this.hasSetup = true;
  }

  private getRunErrorPath() {
    return ppath.resolve(this.project.cwd, "yarnBuild-error.log" as Filename);
  }
  private getRunLogPath() {
    return ppath.resolve(
      this.project.cwd,
      ".yarn" as Filename,
      YARN_RUN_CACHE_FILENAME
    );
  }
  private async readRunLog(): Promise<RunLog> {
    const runLog = new Map<string, RunLogEntry>();

    try {
      const runLogFile: RunLogFile = await xfs.readJsonPromise(
        this.getRunLogPath()
      );

      if (runLogFile && runLogFile.packages) {
        for (const id in runLogFile.packages) {
          runLog.set(id, {
            lastModified: runLogFile.packages[id].lastModified,
            status: runLogFile.packages[id].status,
            haveCheckedForRerun: false,
            rerun: true,
            command: this.runCommand,
          });
        }
      }
    } catch {}

    return runLog;
  }

  private async saveRunLog() {
    if (!this.runLog) {
      return;
    }
    let runLogFileOnDisk: RunLogFile | undefined;
    try {
      runLogFileOnDisk = await xfs.readJsonPromise(this.getRunLogPath());
    } catch {
      // do nothing
    }
    const runLogFile: RunLogFile = {
      comment:
        "This is an auto-generated file," +
        " it keeps track of whats been built." +
        " This is a local file, don't store this in version control.",
      packages: {
        ...(runLogFileOnDisk && runLogFileOnDisk.packages),
      },
    };

    for (const [id, entry] of this.runLog) {
      if (entry.status !== RunStatus.succeeded) {
        continue;
      }

      runLogFile.packages[id] = {
        ...runLogFile.packages[id],
        ...this.runLog.get(id),
      };
    }

    await xfs.writeJsonPromise(this.getRunLogPath(), runLogFile);
  }

  logError(s: string) {
    if (this.verbose && this.errorLogFile) {
      this.errorLogFile.write("➤ YN0009: " + stripAnsi(s) + "\n");
    }
    if (isCI) {
      process.stderr.write("➤ YN0009: " + stripAnsi(s) + "\n");
    }
  }

  setupRunReporter = () => {
    this.runReporter.on(
      RunSupervisorReporterEvents.pending,
      (relativeCwd: PortablePath, name: string) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd] = {
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

    this.runReporter.on(
      RunSupervisorReporterEvents.start,
      (relativeCwd: PortablePath, name: string, runScript: string) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd] = {
            ...this.runReport.workspaces[relativeCwd],
            start: Date.now(),
            runScript: runScript,
            name,
          };
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.info,
      (relativeCwd: PortablePath, message: string) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd].stdout.push(message);
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.error,
      (relativeCwd: PortablePath, error: Error) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd].stderr.push(error);
          this.logError(`${relativeCwd} ${error}`);

          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.success,
      (relativeCwd: PortablePath) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd] = {
            ...this.runReport.workspaces[relativeCwd],
            done: true,
          };

          this.runReport.successCount++;
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.fail,
      (relativeCwd: PortablePath, error: Error) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd].stderr.push(error);

          this.runReport.workspaces[relativeCwd].done = true;
          this.runReport.workspaces[relativeCwd].fail = true;

          this.runReport.failCount++;

          this.logError(`${relativeCwd} ${error}`);

          // TODO: if fail immediately
          // this.runReporter.emit(RunReporterEvents.finish);
          release();
        });
      }
    );

    // this.runReporter.on(RunReporterEvents.finish, () => {});
  };

  async addRunTarget(workspace: Workspace) {
    this.entrypoints.push(this.runGraph.addNode(workspace.relativeCwd));
    const shouldRun = await this.plan(workspace);

    if (shouldRun) {
      this.runTargets.push(workspace);
    }
  }

  plan = async (workspace: Workspace): Promise<boolean> => {
    const parent = this.runGraph
      .addNode(workspace.relativeCwd)
      .addWorkSpace(workspace);

    let rerunParent = false;

    this.runMutexes[workspace.relativeCwd] = new Mutex();

    for (const dependencyType of Manifest.hardDependencies) {
      for (const descriptor of workspace.manifest
        .getForScope(dependencyType)
        .values()) {
        const depWorkspace = this.project.tryWorkspaceByDescriptor(descriptor);

        if (depWorkspace === null) continue;

        const dep = this.runGraph
          .addNode(depWorkspace.relativeCwd)
          .addWorkSpace(depWorkspace);

        parent.addDependency(dep);

        const depsOfDepsNeedRerun = await this.plan(depWorkspace);

        let depNeedsRun = false;
        if (depWorkspace !== this.project.topLevelWorkspace) {
          depNeedsRun = await this.checkIfRunIsRequired(depWorkspace);
        }

        if (depNeedsRun || depsOfDepsNeedRerun) {
          rerunParent = true;
          dep.addRunCallback(this.createRunItem(depWorkspace));
        }
      }
    }
    let hasChanges = false;
    if (workspace !== this.project.topLevelWorkspace) {
      hasChanges = await this.checkIfRunIsRequired(workspace);
    }
    this.runReporter.emit(
      RunSupervisorReporterEvents.pending,
      workspace.relativeCwd
    );
    if (rerunParent || hasChanges) {
      this.runReporter.emit(
        RunSupervisorReporterEvents.pending,
        workspace.relativeCwd,
        `${
          workspace.manifest.name?.scope
            ? `@${workspace.manifest.name?.scope}/`
            : ""
        }${workspace.manifest.name?.name}`
      );
      parent.addRunCallback(this.createRunItem(workspace));
      return true;
    } else {
      // Use the previous log entry if we don't need to rerun.
      // This ensures we always have all our run targets in the log.
      const previousRunLog = this.runLog?.get(
        `${workspace.relativeCwd}#${this.runCommand}`
      );
      if (previousRunLog) {
        this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
          lastModified: previousRunLog.lastModified,
          status: RunStatus.succeeded,
          haveCheckedForRerun: true,
          rerun: false,
          command: this.runCommand,
        });
      }
    }

    return false;
  };

  private async checkIfRunIsRequired(workspace: Workspace): Promise<boolean> {
    if (this.ignoreRunCache === true) {
      return true;
    }

    let needsRun = false;
    const dir = ppath.resolve(workspace.project.cwd, workspace.relativeCwd);

    // Determine which folders (if any) may contain run artifacts
    // we need to ignore.
    let ignore;
    let srcDir;

    if (this.pluginConfiguration.enableBetaFeatures.folderConfiguration) {
      if (
        workspace?.manifest?.raw["yarn.build"] &&
        typeof workspace?.manifest.raw["yarn.build"].output === "string"
      ) {
        ignore = `${dir}${path.sep}${workspace?.manifest.raw["yarn.build"].output}` as PortablePath;
      } else if (this.pluginConfiguration.folders.output) {
        ignore = `${dir}${path.sep}${this.pluginConfiguration.folders.output}` as PortablePath;
      } else if (workspace?.manifest.raw.main) {
        ignore = `${dir}${path.sep}${
          workspace?.manifest.raw.main.substring(
            0,
            workspace?.manifest.raw.main.lastIndexOf(path.sep)
          ) as PortablePath
        }` as PortablePath;
      }

      if (
        workspace?.manifest?.raw["yarn.build"] &&
        typeof workspace?.manifest.raw["yarn.build"].input === "string"
      ) {
        srcDir = `${dir}${path.sep}${workspace?.manifest.raw["yarn.build"].input}` as PortablePath;
      } else if (this.pluginConfiguration.folders.input) {
        srcDir = `${dir}${path.sep}${this.pluginConfiguration.folders.input}` as PortablePath;
      }
    }

    // If the source directory is the package root, remove `/.` from the end of
    // the path, so getLastModifiedForFolder can compare the paths correctly
    if (srcDir?.endsWith("/.")) {
      srcDir = srcDir.substring(0, srcDir.length - 2) as PortablePath;
    }

    // Traverse the dirs and see if they've been modified
    const release = await this.runReport.mutex.acquire();
    try {
      const previousRunLog = this.runLog?.get(
        `${workspace.relativeCwd}#${this.runCommand}`
      );

      if (previousRunLog?.haveCheckedForRerun) {
        return previousRunLog?.rerun ?? true;
      }
      const currentLastModified = await getLastModifiedForFolder(
        srcDir ?? dir,
        ignore
      );

      if (previousRunLog?.lastModified !== currentLastModified) {
        needsRun = true;
      }

      this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
        lastModified: currentLastModified,
        status: needsRun ? RunStatus.succeeded : RunStatus.pending,
        haveCheckedForRerun: true,
        rerun: needsRun,
        command: this.runCommand,
      });
    } catch (e) {
      this.logError(
        `${workspace.relativeCwd}: failed to get lastModified (${e})`
      );
    } finally {
      release();
    }

    return needsRun;
  }

  run = async () => {
    if (this.hasSetup === false) {
      throw new Error(
        "RunSupervisor is not setup, you need to call await supervisor.setup()"
      );
    }

    this.runReport.runStart = Date.now();

    // Print our RunReporter output
    if (!this.dryRun && !isCI) {
      Hansi.pad(this.concurrency+3); // ensure we have the space we need (required if we start near the bottom of the display).
      this.raf(this.waitUntilDone);
    }

    if (this.dryRun) {
      return;
    }

    this.currentRunTarget =
      this.runTargets.length > 1
        ? "All"
        : this.runTargets[0]?.relativeCwd ?? "Nothing to run";

    const header = this.generateHeaderString();

    // run
    await this.runGraph.run(this.entrypoints);

    const release = await this.runReport.mutex.acquire();

    this.runReport.done = true;

    release();

    if (!isCI) {
      // Cleanup the processing lines
      Hansi.cursorUp(Hansi.linesRequired(this.runReport.previousOutput, process.stdout.columns));
      Hansi.clearScreenDown();
    }

    // Check if there were errors, and print them out
    if (this.runReport.failCount !== 0) {
      this.logError(header);
      process.stdout.write(header + "\n");
      // print out any build errors
      for (const relativePath in this.runReport.workspaces) {
        const workspace = this.runReport.workspaces[relativePath];

        if (workspace.stdout.length !== 0) {
          const lineHeader = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ ┌ [stdout] for ${this.configuration.format(
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
          )} │ └ [stdout] ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineTail);
          process.stdout.write(lineTail + "\n");
        }

        if (workspace.stderr.length !== 0) {
          // stderr doesnt seem to be useful for showing to the user in cli
          // we'll still write it out to the run log
          const lineHeader = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ ┌ [stderr] ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineHeader);
          process.stderr.write(lineHeader + "\n");

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
                process.stderr.write(formattedLine + "\n");
              }
            });
          });

          const lineTail = `${this.configuration.format(
            `➤`,
            `blueBright`
          )} ${this.configuration.format(
            `YN0009:`,
            `grey`
          )} │ └ [stderr] ${this.configuration.format(
            relativePath,
            FormatType.PATH
          )}`;
          this.logError(lineTail);
          process.stderr.write(lineTail + "\n");
        }
      }
    }

    const finalLine = this.generateFinalReport(this.runReport.failCount !== 0);

    process.stdout.write(finalLine);
    this.logError(finalLine);

    // commit the run log
    await this.saveRunLog();

    return this.runReport.failCount === 0;
  };

  // This is a very simple requestAnimationFrame polyfil
  raf = (f: (timestamp: number) => void) => {
    setImmediate(() => f(Date.now()));
  };

  waitUntilDone = (timestamp: number) => {
    if (this.runReport.done) {
      return;
    }

    const output = this.generateProgressString(timestamp);
    Hansi.cursorUp(Hansi.linesRequired(this.runReport.previousOutput, process.stdout.columns));
    Hansi.clearScreenDown();

    process.stdout.write(output);

    this.runReport.previousOutput = output;

    delay(90).then(() => {
      this.raf(this.waitUntilDone);
    });
  };

  generateHeaderString(): string {
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = this.configuration.format(`YN0000:`, `grey`);

    return `${arrow} ${code} ┌ Run ${this.configuration.format(
      `${this.runCommand}`,
      FormatType.CODE
    )} for ${this.configuration.format(
      this.currentRunTarget ? this.currentRunTarget : "",
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

    const generateIndexString = (s: number) =>
      this.configuration.format(`[${s}]`, `grey`);

    const idleString = this.configuration.format(`IDLE`, `grey`);

    output += this.generateHeaderString() + "\n";

    let i = 1;

    for (const relativePath in this.runReport.workspaces) {
      const thread = this.runReport.workspaces[relativePath];
      if (!thread || !thread.start || thread.done) {
        continue;
      }

      const pathString = this.configuration.format(
        relativePath,
        FormatType.PATH
      );

      const runScriptString = this.configuration.format(
        `(${thread.runScript})`,
        FormatType.REFERENCE
      );

      const timeString = thread.start
        ? this.configuration.format(
            formatTimestampDifference(thread.start, timestamp),
            FormatType.RANGE
          )
        : "";
      const indexString = generateIndexString(i++);
      const indexSpacer = ` `.repeat(indexString.length - 1);
      const referenceString = this.configuration.format(thread.name, FormatType.NAME);

      let outputString  = `${prefix} ${indexString} ${pathString}${referenceString} ${runScriptString} ${timeString}\n`;

      // If output width is more than the available width then we will use multiple lines.
      let outputSegment1 = ``;
      let outputSegment2 = ``;
      let outputSegment3 = ``;

      if (stripAnsi(outputString).length >= process.stdout.columns) {
        outputSegment1 = `${prefix} ${indexString} ${pathString}${referenceString}\n`;
        outputSegment2 = `${indexSpacer} ${this.configuration.format(` └`, `grey`)} ${runScriptString} ${timeString}\n`;

        if (stripAnsi(outputSegment1).length >= process.stdout.columns) {
          outputSegment1 = sliceAnsi(`${prefix} ${indexString} ${pathString}\n`, 0, process.stdout.columns);
          outputSegment2 = sliceAnsi(`${indexSpacer} ${this.configuration.format(` │`, `grey`)} ${referenceString}\n`, 0, process.stdout.columns);
          outputSegment3 = sliceAnsi(`${indexSpacer} ${this.configuration.format(` └`, `grey`)} ${runScriptString} ${timeString}\n`, 0, process.stdout.columns);
        }
        outputString = outputSegment1 + outputSegment2 + outputSegment3;
      }

      output += outputString;

    }

    for (i; i < this.concurrency + 1; ) {
      output += `${prefix} ${generateIndexString(i++)} ${idleString}\n`;
    }

    if (this.runReport.runStart) {
      output += this.generateRunCountString(timestamp);
    }
    return output;
  }

  generateRunCountString = (timestamp: number) => {
    const grey = (s: string) => this.configuration.format(s, `grey`);
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = grey(`YN0000:`);

    let output = "";
    if (this.runReport.runStart) {
      const successString = this.configuration.format(
        `${this.runReport.successCount}`,
        "green"
      );
      const failedString = this.configuration.format(
        `${this.runReport.failCount}`,
        "red"
      );
      const totalString = this.configuration.format(
        `${this.runGraph.runSize}`,
        "grey"
      );

      output += `${arrow} ${code} └ ${grey("[")}${successString}${grey(
        ":"
      )}${failedString}${grey("/")}${totalString}${grey(
        "]"
      )} ${formatTimestampDifference(this.runReport.runStart, timestamp)}\n`;
    }
    return output;
  };

  generateFinalReport = (hasPreceedingLine: boolean) => {
    const grey = (s: string) => this.configuration.format(s, `grey`);
    const arrow = this.configuration.format(`➤`, `blueBright`);
    const code = grey(`YN0000:`);

    let output = `${arrow} ${code} ${
      hasPreceedingLine ? `└` : arrow
    } Run [ ${this.configuration.format(
      `${this.runCommand} finished`,
      this.runReport.failCount === 0 ? "green" : "red"
    )}${
      this.runReport.failCount != 0
        ? this.configuration.format(
            ` with ${this.runReport.failCount} errors`,
            "red"
          )
        : ""
    } ]\n`;
    if (this.runReport.runStart) {
      const successString = this.configuration.format(
        `${this.runReport.successCount}`,
        "green"
      );
      const failedString = this.configuration.format(
        `${this.runReport.failCount}`,
        "red"
      );
      const totalString = this.configuration.format(
        `${this.runGraph.runSize}`,
        "grey"
      );

      output += `${arrow} ${code} ${grey("[")}${successString}${grey(
        ":"
      )}${failedString}${grey("/")}${totalString}${grey("]")}\n`;
    }
    return output;
  };

  // Returns a PQueue item
  createRunItem = (workspace: Workspace) => {
    return async () =>
      await this.limit(
        async (): Promise<boolean> => {
          const prefix = workspace.relativeCwd;

          const command = workspace.manifest.scripts.get(this.runCommand);

          const currentRunLog = this.runLog?.get(
            `${workspace.relativeCwd}#${this.runCommand}`
          );

          this.runReporter.emit(
            RunSupervisorReporterEvents.start,
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
              this.runReporter.emit(
                RunSupervisorReporterEvents.info,
                workspace.relativeCwd,
                `Missing \`${this.runCommand}\` script in manifest.`
              );
            }

            this.runReporter.emit(
              RunSupervisorReporterEvents.success,
              workspace.relativeCwd
            );
            return true;
          }

          try {
            const exitCode = await this.cli(
              this.runCommand,
              workspace.cwd,
              this.runReporter,
              prefix
            );

            if (exitCode !== 0) {
              this.runReporter.emit(
                RunSupervisorReporterEvents.fail,
                workspace.relativeCwd
              );

              this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
                lastModified: currentRunLog?.lastModified,
                status: RunStatus.failed,
                haveCheckedForRerun: true,
                rerun: false,
                command: this.runCommand,
              });

              return false;
            }

            this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
              lastModified: currentRunLog?.lastModified,
              status: RunStatus.succeeded,
              haveCheckedForRerun: true,
              rerun: false,
              command: this.runCommand,
            });

            this.runReporter.emit(
              RunSupervisorReporterEvents.success,
              workspace.relativeCwd
            );
          } catch (e) {
            this.runReporter.emit(
              RunSupervisorReporterEvents.fail,
              workspace.relativeCwd,
              e
            );

            this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
              lastModified: currentRunLog?.lastModified,
              status: RunStatus.failed,
              haveCheckedForRerun: true,
              rerun: false,
              command: this.runCommand,
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
  let lastModified = 0;

  const files = await xfs.readdirPromise(folder);

  await Promise.all(
    files.map(async (file) => {
      const filePath = `${folder}${path.sep}${file}` as PortablePath;

      if (ignore && filePath.startsWith(ignore)) {
        return;
      }

      const stat = await xfs.statPromise(filePath);
      if (stat.isFile()) {
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

export const formatTimestampDifference = (from: number, to: number): string => {
  let milliseconds = Math.abs(to - from);
  let output = "";

  const minutes = Math.trunc(milliseconds / 60000);

  if (minutes) {
    output += `${minutes}m`;
    milliseconds -= minutes * 60000;
  }

  if (milliseconds) {
    if (minutes) {
      output += ` `;
    }
    output += `${(milliseconds/1000).toFixed(2)}s`;
  }

  return output;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default RunSupervisor;

export { RunSupervisor, RunSupervisorReporterEvents };
