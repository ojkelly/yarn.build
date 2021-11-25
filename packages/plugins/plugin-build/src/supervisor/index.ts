import {
  Configuration,
  Manifest,
  Project,
  StreamReport,
  Workspace,
  FormatType,
  formatUtils,
} from "@yarnpkg/core";
import isCI from "is-ci";
import { cpus } from "os";
import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { YarnBuildConfiguration } from "../config";

import { EventEmitter } from "events";
import PQueue from "p-queue";
import path from "path";
import PLimit, { Limit } from "p-limit";
import { Mutex } from "await-semaphore";
import fs from "fs";
import stripAnsi from "strip-ansi";
import sliceAnsi from "slice-ansi";
import { Graph, Node, RunCallback } from "./graph";
import { Hansi } from "./hansi";
import { terminateAllChildProcesses } from "./terminate";

const YARN_RUN_CACHE_FILENAME = "yarn.build.json" as Filename;

const DIVIDER_LENGTH = 80;
const DIVIDER = "-".repeat(DIVIDER_LENGTH);

enum RunStatus {
  pending = "pending",
  skipped = "skipped",
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
  skipped = "skipped",
  ignored = "ignored",
  success = "success",
  fail = "fail",
  finish = "finish",
  forceQuit = "force-quit",
}

type RunReport = {
  mutex: Mutex;
  runStart?: number;
  totalJobs: number;
  bail?: boolean;
  previousOutput: string;
  successCount: number;
  failCount: number;
  skipCount: number;
  ignoredCount: number;
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
      runtimeSeconds?: number;
      skipped?: boolean;
      ignored?: boolean;
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

  shouldBailInstantly = false;

  concurrency: number;

  limit: Limit;

  queue: PQueue;

  entrypoints: Node[] = [];

  runReporter: EventEmitter = new EventEmitter();

  runReport: RunReport = {
    mutex: new Mutex(),
    totalJobs: 0,
    skipCount: 0,
    previousOutput: ``,
    successCount: 0,
    failCount: 0,
    ignoredCount: 0,
    bail: false,
    workspaces: {},
    done: false,
  };

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
    concurrency,
    shouldBailInstantly,
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
    concurrency?: number | undefined;
    shouldBailInstantly?: boolean;
  }) {
    const resolvedConcurrency = concurrency ?? Math.max(1, cpus().length);

    this.configuration = configuration;
    this.pluginConfiguration = pluginConfiguration;
    this.project = project;
    this.report = report;
    this.runCommand = runCommand;
    this.cli = cli;
    this.dryRun = dryRun;
    this.ignoreRunCache = ignoreRunCache;
    this.verbose = verbose;
    this.concurrency = resolvedConcurrency;
    this.shouldBailInstantly = shouldBailInstantly ?? this.shouldBailInstantly;
    this.limit = PLimit(resolvedConcurrency);

    this.queue = new PQueue({
      concurrency: resolvedConcurrency,
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

  async setup(): Promise<void> {
    this.runLog = await this.readRunLog();
    this.setupRunReporter();

    this.hasSetup = true;
  }

  private getRunErrorPath() {
    return ppath.resolve(this.project.cwd, "yarn.build-error.log" as Filename);
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

  logError(s: string): void {
    if (this.verbose) {
      process.stderr.write(stripAnsi(s) + "\n");
    }
  }

  setupRunReporter = (): void => {
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
      RunSupervisorReporterEvents.skipped,
      (relativeCwd: PortablePath) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd].done = true;
          this.runReport.workspaces[relativeCwd].skipped = true;

          this.runReport.skipCount++;
          release();
        });
      }
    );
    this.runReporter.on(
      RunSupervisorReporterEvents.ignored,
      (relativeCwd: PortablePath) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd].done = true;
          this.runReport.workspaces[relativeCwd].ignored = true;

          this.runReport.ignoredCount++;
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
          release();
        });
      }
    );
  };

  async addRunTarget(workspace: Workspace): Promise<void> {
    this.entrypoints.push(this.runGraph.addNode(workspace.relativeCwd));
    const shouldRun = await this.plan(workspace);

    if (shouldRun) {
      this.runTargets.push(workspace);
    }
  }

  getDependenciesCount = async (workspace: Workspace): Promise<number> => {
    let value = 0;

    for (const dependencyType of Manifest.hardDependencies) {
      for (const descriptor of workspace.manifest
        .getForScope(dependencyType)
        .values()) {
        const depWorkspace = this.project.tryWorkspaceByDescriptor(descriptor);

        if (depWorkspace === null) continue;

        value += 1;
      }
    }

    return value;
  };

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

    if (
      workspace?.manifest?.raw["yarn.build"] &&
      typeof workspace?.manifest.raw["yarn.build"].output === "string"
    ) {
      ignore =
        `${dir}${path.posix.sep}${workspace?.manifest.raw["yarn.build"].output}` as PortablePath;
    } else if (this.pluginConfiguration.folders.output) {
      ignore =
        `${dir}${path.posix.sep}${this.pluginConfiguration.folders.output}` as PortablePath;
    } else if (workspace?.manifest.raw.main) {
      ignore = `${dir}${path.posix.sep}${
        workspace?.manifest.raw.main.substring(
          0,
          workspace?.manifest.raw.main.lastIndexOf(path.posix.sep)
        ) as PortablePath
      }` as PortablePath;
    }

    if (
      workspace?.manifest?.raw["yarn.build"] &&
      typeof workspace?.manifest.raw["yarn.build"].input === "string"
    ) {
      srcDir =
        `${dir}${path.posix.sep}${workspace?.manifest.raw["yarn.build"].input}` as PortablePath;
    } else if (this.pluginConfiguration.folders.input) {
      srcDir =
        `${dir}${path.posix.sep}${this.pluginConfiguration.folders.input}` as PortablePath;
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

  run = async (): Promise<boolean> => {
    if (this.hasSetup === false) {
      throw new Error(
        "RunSupervisor is not setup, you need to call await supervisor.setup()"
      );
    }

    this.runReport.runStart = Date.now();

    // Print our RunReporter output
    if (!this.dryRun && !isCI) {
      Hansi.pad(this.concurrency + 3); // ensure we have the space we need (required if we start near the bottom of the display).
      this.raf(this.waitUntilDone);
    }

    if (this.dryRun) {
      return true;
    }

    this.currentRunTarget =
      this.runTargets.length > 1
        ? "All"
        : this.runTargets[0]?.relativeCwd ?? "Nothing to run";

    // theres an off by one error in the RunLog
    if (!isCI) {
      process.stderr.write("\n");
    }

    const header = this.generateHeaderString();

    // run
    await this.runGraph.run(this.entrypoints);

    const release = await this.runReport.mutex.acquire();

    this.runReport.done = true;

    release();

    if (!isCI) {
      // Cleanup the processing lines
      Hansi.cursorUp(
        Hansi.linesRequired(
          this.runReport.previousOutput,
          process.stdout.columns
        )
      );
      Hansi.clearScreenDown();
    }

    // Check if there were errors, and print them out
    if (this.runReport.failCount !== 0) {
      const packagesWithErrors: string[] = [];

      process.stdout.write(this.formatHeader(header) + "\n");
      let hasOutput = false;

      // print out any build errors
      for (const relativePath in this.runReport.workspaces) {
        const workspace = this.runReport.workspaces[relativePath];

        if (workspace.fail) {
          packagesWithErrors.push(relativePath);
        }

        if (workspace.stdout.length !== 0 || workspace.stderr.length !== 0) {
          hasOutput = true;
          const lineHeader = this.formatHeader(
            `Output: ${formatUtils.pretty(
              this.configuration,
              relativePath,
              FormatType.NAME // TODO should be PATH, but the types complain - might be yarn bug
            )}`,
            2
          );

          process.stdout.write(lineHeader + "\n");
        }
        if (workspace.stdout.length !== 0) {
          hasOutput = true;
          workspace.stdout.forEach((m) => {
            const lines = m.split("\n");

            lines.forEach((line) => {
              if (line.length !== 0) {
                process.stdout.write(line + "\n");
              }
            });
          });
        }

        if (workspace.stderr.length !== 0) {
          hasOutput = true;

          // stderr doesnt seem to be useful for showing to the user in cli
          // we'll still write it out to the run log
          const lineHeader = `[stderr]`;

          process.stderr.write(lineHeader + "\n");

          workspace.stderr.forEach((e) => {
            const err = e instanceof Error ? e.toString() : `${e}`;
            const lines = err.split("\n");

            lines.forEach((line) => {
              if (line.length !== 0) {
                process.stderr.write(line + "\n");
              }
            });
          });
        }
      }

      if (hasOutput) {
        process.stdout.write(this.grey(DIVIDER) + "\n");
      }
      if (packagesWithErrors.length > 0) {
        const errorHeader = this.grey(
          `ERROR for script ${header}\nThe following packages returned an error.\n`
        );

        process.stderr.write(errorHeader);

        packagesWithErrors.forEach((relativePath) => {
          const lineTail = `- ${formatUtils.pretty(
            this.configuration,
            relativePath,
            FormatType.NAME
          )}`;

          process.stderr.write(lineTail + "\n");
        });
      }
      process.stderr.write(
        this.grey(`Search \`Output: path\` to find the start of the output.\n`)
      );
    }

    const finalLine = this.generateFinalReport();

    process.stdout.write(finalLine);

    // commit the run log
    await this.saveRunLog();

    return this.runReport.failCount === 0;
  };

  // This is a very simple requestAnimationFrame polyfil
  raf = (f: (timestamp: number) => void): void => {
    setImmediate(() => f(Date.now()));
  };

  waitUntilDone = (timestamp: number): void => {
    if (this.runReport.done) {
      return;
    }
    const output = this.generateProgressString(timestamp);

    Hansi.cursorUp(
      Hansi.linesRequired(this.runReport.previousOutput, process.stdout.columns)
    );
    Hansi.clearScreenDown();

    process.stdout.write(output);

    this.runReport.previousOutput = output;

    delay(90).then(() => {
      this.raf(this.waitUntilDone);
    });
  };

  grey = (s: string): string =>
    formatUtils.pretty(this.configuration, s, `grey`);

  formatHeader(name: string, depth = 0): string {
    const label = `${this.grey("-".repeat(depth) + "[")} ${name} ${this.grey(
      "]"
    )}`;
    const length = stripAnsi(label).length;

    return label + this.grey("-".repeat(DIVIDER_LENGTH - length));
  }

  generateHeaderString(): string {
    return `${formatUtils.pretty(
      this.configuration,
      `${this.runCommand}`,
      FormatType.CODE
    )} for ${formatUtils.pretty(
      this.configuration,
      this.currentRunTarget ? this.currentRunTarget : "",
      FormatType.SCOPE
    )}${
      this.dryRun
        ? formatUtils.pretty(this.configuration, ` --dry-run`, FormatType.NAME)
        : ""
    }`;
  }

  generateProgressString(timestamp: number): string {
    let output = "";

    const generateIndexString = (s: number) => this.grey(`[${s}]`);

    const idleString = formatUtils.pretty(this.configuration, `IDLE`, `grey`);

    output += this.formatHeader(this.generateHeaderString()) + "\n";

    let i = 1;

    for (const relativePath in this.runReport.workspaces) {
      const thread = this.runReport.workspaces[relativePath];

      if (!thread || !thread.start || thread.done) {
        continue;
      }

      if (!!this.runReport.runStart) {
        this.runReport.workspaces[relativePath].runtimeSeconds =
          timestamp - this.runReport.runStart;
      }

      const pathString = formatUtils.pretty(
        this.configuration,
        relativePath,
        FormatType.NAME
      );

      const runScriptString = formatUtils.pretty(
        this.configuration,
        `(${thread.runScript})`,
        FormatType.REFERENCE
      );

      const timeString = thread.start
        ? formatUtils.pretty(
            this.configuration,
            formatTimestampDifference(thread.start, timestamp),
            FormatType.RANGE
          )
        : "";
      const indexString = generateIndexString(i++);
      const indexSpacer = ` `.repeat(indexString.length - 1);
      const referenceString = formatUtils.pretty(
        this.configuration,
        thread.name,
        FormatType.NAME
      );

      let outputString = `${indexString} ${pathString}${referenceString} ${runScriptString} ${timeString}\n`;

      // If output width is more than the available width then we will use multiple lines.
      let outputSegment1 = ``;
      let outputSegment2 = ``;
      let outputSegment3 = ``;

      if (stripAnsi(outputString).length >= process.stdout.columns) {
        outputSegment1 = `${indexString} ${pathString}${referenceString}\n`;
        outputSegment2 = `${indexSpacer} ${runScriptString} ${timeString}\n`;

        if (stripAnsi(outputSegment1).length >= process.stdout.columns) {
          outputSegment1 = sliceAnsi(
            `${indexString} ${pathString}\n`,
            0,
            process.stdout.columns
          );
          outputSegment2 = sliceAnsi(
            `${indexSpacer} ${referenceString}\n`,
            0,
            process.stdout.columns
          );
          outputSegment3 = sliceAnsi(
            `${indexSpacer} ${runScriptString} ${timeString}\n`,
            0,
            process.stdout.columns
          );
        }
        outputString = outputSegment1 + outputSegment2 + outputSegment3;
      }

      output += outputString;
    }

    for (i; i < this.concurrency + 1; ) {
      output += `${generateIndexString(i++)} ${idleString}\n`;
    }

    if (this.runReport.runStart) {
      output += this.generateRunCountString(timestamp);
    }

    return output;
  }

  generateRunCountString = (timestamp: number): string => {
    let output = "";

    if (this.runReport.runStart) {
      const successString = formatUtils.pretty(
        this.configuration,
        `${this.runReport.successCount}`,
        "green"
      );
      const failedString = formatUtils.pretty(
        this.configuration,
        `${this.runReport.failCount}`,
        "red"
      );
      const totalString = formatUtils.pretty(
        this.configuration,
        `${this.runGraph.runSize}`,
        "white"
      );

      output +=
        this.formatHeader(
          `${successString}:${failedString}/${totalString} ${formatTimestampDifference(
            this.runReport.runStart,
            timestamp
          )}`
        ) + `\n`;
    }

    return output;
  };

  generateFinalReport = (): string => {
    const heading =
      this.formatHeader(
        `${formatUtils.pretty(
          this.configuration,
          `${this.runCommand} finished`,
          this.runReport.failCount === 0 ? "green" : "red"
        )}${
          this.runReport.failCount != 0
            ? formatUtils.pretty(
                this.configuration,
                ` with ${this.runReport.failCount} errors`,
                "red"
              )
            : ""
        }`
      ) + "\n";

    let output = this.formatHeader("Summary") + "\n";

    if (this.runReport.runStart) {
      const { successCount, failCount, ignoredCount, skipCount } =
        this.runReport;

      const total = this.runGraph.size - ignoredCount;

      const upToDate = total - failCount - successCount - skipCount;

      const successString = formatUtils.pretty(
        this.configuration,
        `Success: ${successCount}`,
        "green"
      );
      const failedString = formatUtils.pretty(
        this.configuration,
        `Fail: ${failCount}`,
        "red"
      );
      const skippedString = formatUtils.pretty(
        this.configuration,
        `Skipped: ${skipCount}`,
        "white"
      );
      const upToDateString = formatUtils.pretty(
        this.configuration,
        `Up to date: ${upToDate}`,
        "white"
      );

      const totalString = formatUtils.pretty(
        this.configuration,
        `Total: ${total}`,
        "white"
      );

      output +=
        successString + "\n" + failedString + "\n" + skippedString + "\n";

      if (!this.ignoreRunCache) output += upToDateString + "\n";

      output += totalString + "\n" + this.grey("---") + "\n";
    }

    let totalMs = 50;

    for (const relativePath in this.runReport.workspaces) {
      const workspace = this.runReport.workspaces[relativePath];

      totalMs += workspace.runtimeSeconds ?? 0;
    }

    if (!!this.runReport.runStart && this.runGraph.runSize > 1) {
      const cpuTime = totalMs;
      const now = Date.now();
      const wallTime = now - this.runReport.runStart;
      const savedTime = formatTimestampDifference(wallTime, cpuTime);

      if (!isCI) {
        output += `Cumulative: (cpu): ${formatTimestampDifference(
          0,
          totalMs
        )}\n`;
        output += `Saved: ${savedTime}\n`;
      }
    }
    if (!!this.runReport.runStart) {
      output +=
        `Runtime (wall): ` +
        formatTimestampDifference(Date.now(), this.runReport.runStart) +
        `\n`;
    }
    output += heading;

    return output;
  };

  // Returns a PQueue item
  createRunItem = (workspace: Workspace): RunCallback => {
    return async () =>
      await this.limit(async (): Promise<boolean> => {
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
            RunSupervisorReporterEvents.ignored,
            workspace.relativeCwd
          );

          return true;
        }

        try {
          if (this.runReport.bail) {
            // We have bailed skip all!
            this.runReporter.emit(
              RunSupervisorReporterEvents.skipped,
              workspace.relativeCwd
            );
            this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
              lastModified: currentRunLog?.lastModified,
              status: RunStatus.skipped,
              haveCheckedForRerun: true,
              rerun: false,
              command: this.runCommand,
            });

            return false;
          }
          const exitCode = await this.cli(
            this.runCommand,
            workspace.cwd,
            this.runReporter,
            prefix
          );

          if (exitCode !== 0) {
            if (
              this.shouldBailInstantly &&
              this.runReport.bail &&
              exitCode > 100
            ) {
              // This has been force killed
              this.runReporter.emit(
                RunSupervisorReporterEvents.skipped,
                workspace.relativeCwd
              );

              this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
                lastModified: currentRunLog?.lastModified,
                status: RunStatus.skipped,
                haveCheckedForRerun: true,
                rerun: false,
                command: this.runCommand,
              });

              return false;
            }
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
            if (this.shouldBailInstantly && !this.runReport.bail) {
              this.runReport.bail = true;
              void terminateAllChildProcesses();
            }

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
      });
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
      const filePath = `${folder}${path.posix.sep}${file}` as PortablePath;

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
    output += `${(milliseconds / 1000).toFixed(2)}s`;
  }

  return output;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default RunSupervisor;

export { RunSupervisor, RunSupervisorReporterEvents };
