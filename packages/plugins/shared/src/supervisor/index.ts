import {
  Configuration,
  Manifest,
  Project,
  StreamReport,
  Workspace,
  FormatType,
  Locator,
  formatUtils,
} from "@yarnpkg/core";
import isCI from "is-ci";
import { cpus } from "os";
import { Filename, PortablePath, npath, ppath, xfs } from "@yarnpkg/fslib";
import { getWorkspaceConfiguration, YarnBuildConfiguration } from "../config";
import globby from "globby";

import { EventEmitter } from "events";
import PQueue from "p-queue";
import PLimit, { Limit } from "p-limit";
import { Mutex } from "await-semaphore";
import fs from "fs";
import stripAnsi from "strip-ansi";
import sliceAnsi from "slice-ansi";
import { Graph, Node, RunCallback } from "./graph";
import { Hansi } from "./hansi";
import { terminateAllChildProcesses } from "./terminate";
import { SpanStatusCode } from "@opentelemetry/api";
import {
  Tracer,
  Context,
  Attribute,
} from "@ojkelly/yarn-build-shared/src/tracing";
import { parseTsconfig } from "get-tsconfig";
import objectHash from "object-hash";

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
  checksum?: string;
  status?: RunStatus;
  rerun?: boolean;
  command: string;
  exitCode?: string;
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
      locator: Locator;
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
  ctx: Context,
  command: string,
  cwd: PortablePath,
  runReporter: EventEmitter,
  prefix: string
) => Promise<number>;

class RunSupervisor {
  tracer: Tracer = new Tracer("yarn.build");

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

  continueOnError = false;

  concurrency: number;

  limit: Limit;

  queue: PQueue;

  entrypoints: Set<Node> = new Set<Node>();

  excluded: Set<Workspace> = new Set<Workspace>();

  runReporter: EventEmitter = new EventEmitter();

  ignoreDependencies = false;

  failFast = false;

  runReport: RunReport = {
    mutex: new Mutex(),
    totalJobs: 0,
    skipCount: 0,
    previousOutput: ``,
    successCount: 0,
    failCount: 0,
    ignoredCount: 0,
    workspaces: {},
    done: false,
  };

  header = "";

  nextUnitOfWork: Promise<void>[] = [];

  errorLogFile: fs.WriteStream | undefined;

  excludeWorkspacePredicate: (targetWorkspace: Workspace) => boolean;

  checkIfRunIsRequiredCache: { [key: PortablePath]: boolean } = {};

  planCache: { [key: PortablePath]: boolean } = {};

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
    continueOnError,
    excludeWorkspacePredicate,
    ignoreDependencies,
    failFast,
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
    continueOnError: boolean;
    excludeWorkspacePredicate: (targetWorkspace: Workspace) => boolean;
    ignoreDependencies: boolean;
    failFast: boolean;
  }) {
    // fallback to the max concurrency of cpu threads
    const resolvedConcurrency = concurrency ?? cpus().length;

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
    this.continueOnError = continueOnError;
    this.limit = PLimit(resolvedConcurrency);
    this.queue = new PQueue({
      concurrency: resolvedConcurrency,
      carryoverConcurrencyCount: true,
      timeout: 50000, // TODO: make this customisable
      throwOnTimeout: true,
      autoStart: true,
    });
    this.excludeWorkspacePredicate = excludeWorkspacePredicate;
    if (this.verbose) {
      this.errorLogFile = xfs.createWriteStream(this.getRunErrorPath(), {
        flags: "a",
      });
    }
    this.ignoreDependencies = ignoreDependencies;
    this.failFast = failFast;
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
            checksum: runLogFile.packages[id].checksum,
            status: runLogFile.packages[id].status,
            rerun: runLogFile.packages[id].rerun,
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

    for (const [id] of this.runLog) {
      runLogFile.packages[id] = {
        ...runLogFile.packages[id],
        ...this.runLog.get(id),
      };
    }

    await xfs.writeJsonPromise(this.getRunLogPath(), runLogFile);
  }

  setupRunReporter = (): void => {
    this.runReporter.on(
      RunSupervisorReporterEvents.pending,
      (relativeCwd: PortablePath, locator: Locator, name: string) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd] = {
            name,
            stdout: [],
            stderr: [],
            done: false,
            fail: false,
            locator,
          };
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.start,
      (
        relativeCwd: PortablePath,
        locator: Locator,
        name: string,
        runScript: string
      ) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          this.runReport.workspaces[relativeCwd] = {
            ...this.runReport.workspaces[relativeCwd],
            start: Date.now(),
            runScript: runScript,
            name,
            locator,
          };
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.info,
      (relativeCwd: PortablePath, message: string) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          if (typeof message != `undefined`) {
            this.runReport.workspaces[relativeCwd].stdout.push(message);
          }
          release();
        });
      }
    );

    this.runReporter.on(
      RunSupervisorReporterEvents.error,
      (relativeCwd: PortablePath, error: Error) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          if (typeof error != `undefined`) {
            this.runReport.workspaces[relativeCwd].stderr.push(error);
          }
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

          const wrk = this.runReport.workspaces[relativeCwd];

          if (isCI) {
            const pkg = `✅ ${relativeCwd}`.padEnd(60);
            const timing = formatTimestampDifference(
              0,
              wrk.runtimeSeconds ?? 0
            ).padStart(19);

            process.stdout.write(`${pkg}${timing}\n`);
          }
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

          if (isCI) {
            const pkg = `⏩ ${relativeCwd} `.padEnd(60);
            const timing = `--`.padStart(19);

            process.stdout.write(`${pkg}${timing}\n`);
          }
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

          const wrk = this.runReport.workspaces[relativeCwd];
          const l = this.runLog?.get(`${relativeCwd}#${this.runCommand}`);

          if (isCI) {
            const pkg = `[IGNORE${l?.exitCode ? `: ${l?.exitCode}` : ""}] ${
              wrk.name
            } `.padEnd(60);
            const timing = `--`.padStart(19);

            process.stdout.write(`${pkg}${timing}\n`);
          }
        });
      }
    );
    this.runReporter.on(
      RunSupervisorReporterEvents.fail,
      (relativeCwd: PortablePath, error: Error) => {
        this.runReport.mutex.acquire().then((release: () => void) => {
          if (typeof error != `undefined`) {
            this.runReport.workspaces[relativeCwd].stderr.push(error);
          }
          this.runReport.workspaces[relativeCwd].done = true;
          this.runReport.workspaces[relativeCwd].fail = true;
          this.runReport.failCount++;
          release();

          const wrk = this.runReport.workspaces[relativeCwd];
          const l = this.runLog?.get(`${relativeCwd}#${this.runCommand}`);

          if (isCI) {
            const pkg = `❌ ${relativeCwd}`.padEnd(50);
            const timing = `${
              l?.exitCode ? `(exit code: ${l?.exitCode})` : "→"
            } ${formatTimestampDifference(
              0,
              wrk.runtimeSeconds ?? 0
            )}`.padStart(29);

            process.stdout.write(`${pkg}${timing}\n`);
          }
        });
      }
    );
  };

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

  removeFromExcluded(workspace: Workspace): void {
    if (this.excluded.has(workspace)) {
      this.excluded.delete(workspace);
    }
  }

  // Add a run target to the run graph
  // we may call this function multiple times per package when discovering the
  // full run graph
  async addRunTarget(workspace: Workspace): Promise<void> {
    // skip if this workspace is excluded
    if (this.excluded.has(workspace)) {
      return;
    }

    // skip if this workspace matches the predicate for excluding packages
    if (this.excludeWorkspacePredicate(workspace)) {
      this.excluded.add(workspace);

      return;
    }

    // skip if the package does not contain the intended run command
    if (
      typeof workspace.manifest.scripts.get(this.runCommand) === `undefined`
    ) {
      return;
    }

    // add the workspace to the run graph
    const node = this.runGraph.addNode(workspace.relativeCwd);

    await this.plan(node, workspace);
  }

  // this function may be called more than once per package as the run graph
  // is constructed
  plan = async (node: Node, workspace: Workspace): Promise<boolean> => {
    if (!node) {
      throw new Error(
        "Internal error: lost reference to parent workspace. Please open an issue."
      );
    }

    // if we've already checked this workspace, we don't need to check it again
    if (typeof this.planCache[workspace.relativeCwd] !== `undefined`) {
      return this.planCache[workspace.relativeCwd];
    }

    this.runGraph.checkCyclical(node);

    let rerun = false;
    let rerunParent = false;

    this.runMutexes[workspace.relativeCwd] = new Mutex();

    if (this.ignoreDependencies === false) {
      for (const dependencyType of Manifest.hardDependencies) {
        for (const descriptor of workspace.manifest
          .getForScope(dependencyType)
          .values()) {
          const depWorkspace =
            this.project.tryWorkspaceByDescriptor(descriptor);

          // skip external packages
          if (
            depWorkspace === null ||
            this.excludeWorkspacePredicate(depWorkspace)
          ) {
            continue;
          }

          // ignore local workspaces without without the specified run command
          if (
            typeof depWorkspace.manifest.scripts.get(this.runCommand) ===
            `undefined`
          ) {
            continue;
          }

          const dep = this.runGraph.addNode(depWorkspace.relativeCwd);

          node.addDependency(dep);

          // this resolve call checks for cyclic dependencies
          this.runGraph.checkCyclical(dep);

          const depNeedsRun = await this.plan(dep, depWorkspace);

          if (depNeedsRun) {
            this.runGraph.addRunCallback(dep, this.createRunItem(depWorkspace));
            rerunParent = true;
            this.removeFromExcluded(depWorkspace);
          }
        }
      }
    }

    let hasChanges = false;

    if (workspace !== this.project.topLevelWorkspace) {
      hasChanges = await this.checkIfRunIsRequired(workspace);
    }
    this.runReporter.emit(
      RunSupervisorReporterEvents.pending,
      workspace.relativeCwd,
      workspace.locator
    );

    if (rerunParent || hasChanges) {
      rerun = true;
      this.runReporter.emit(
        RunSupervisorReporterEvents.pending,
        workspace.relativeCwd,
        workspace.locator,
        `${
          workspace.manifest.name?.scope
            ? `@${workspace.manifest.name?.scope}/`
            : ""
        }${workspace.manifest.name?.name}`
      );

      this.runGraph.addRunCallback(node, this.createRunItem(workspace));
      this.removeFromExcluded(workspace);
      this.entrypoints.add(node);
      this.runTargets.push(workspace);
    } else {
      // Use the previous log entry if we don't need to rerun.
      // This ensures we always have all our run targets in the log.
      const previousRunLog = this.runLog?.get(
        `${workspace.relativeCwd}#${this.runCommand}`
      );

      if (previousRunLog) {
        this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
          checksum: previousRunLog.checksum,
          status: RunStatus.succeeded,
          rerun: false,
          command: this.runCommand,
        });
      }
    }

    if (rerun) {
      // mark all dependent projects for rerun for the next build
      const dependentWorkspaces = workspace.getRecursiveWorkspaceDependents();

      for (const dependentWorkspace of dependentWorkspaces) {
        this.markWorkspaceForRerun(dependentWorkspace);
      }

      // determine dependencies that need a rebuild and mark their dependent projects for rerun
      const dependencyWorkspaces = Array.from(
        workspace.getRecursiveWorkspaceDependencies()
      ).filter((w) => this.isWorkspaceMarkedForRerun(w));

      for (const dependencyWorkspace of dependencyWorkspaces) {
        const dependentWorkspaces =
          dependencyWorkspace.getRecursiveWorkspaceDependents();

        for (const dependentWorkspace of dependentWorkspaces) {
          this.markWorkspaceForRerun(dependentWorkspace);
        }
      }
    }

    this.planCache[workspace.relativeCwd] = rerun;

    return rerun;
  };

  private markWorkspaceForRerun(workspace: Workspace) {
    // skip if the package does not contain the intended run command
    if (
      typeof workspace.manifest.scripts.get(this.runCommand) === `undefined`
    ) {
      return;
    }

    const previousRunLog = this.runLog?.get(
      `${workspace.relativeCwd}#${this.runCommand}`
    );

    // This ensures we always have all our run targets in the log.
    this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
      checksum: previousRunLog?.checksum ?? "",
      status: RunStatus.succeeded,
      rerun: true,
      command: this.runCommand,
    });
  }

  private isWorkspaceMarkedForRerun(workspace: Workspace): boolean {
    // skip if the package does not contain the intended run command
    if (
      typeof workspace.manifest.scripts.get(this.runCommand) === `undefined`
    ) {
      return false;
    }

    const previousRunLog = this.runLog?.get(
      `${workspace.relativeCwd}#${this.runCommand}`
    );

    return previousRunLog?.rerun ?? false;
  }

  private async checkIfRunIsRequired(workspace: Workspace): Promise<boolean> {
    // if we've already checked this workspace, we don't need to check it again
    if (
      typeof this.checkIfRunIsRequiredCache[workspace.relativeCwd] !==
      `undefined`
    ) {
      return this.checkIfRunIsRequiredCache[workspace.relativeCwd];
    }

    // skip if this workspace doesn't have the command we want to run
    if (typeof workspace.manifest.scripts.get(this.runCommand) !== `string`) {
      this.checkIfRunIsRequiredCache[workspace.relativeCwd] = false;

      return false;
    }

    // workspace have never been checked before:
    // - check if we need to rerun when files or dependencies needs an update
    // - calculate the workspace checksum to prevent future builds
    let needsRun = false;

    // force re-run when we can ignore the cache
    if (this.ignoreRunCache) {
      needsRun = true;
    }

    // if this workspace is already marked for rerun
    const previousRunLog = this.runLog?.get(
      `${workspace.relativeCwd}#${this.runCommand}`
    );

    if (previousRunLog?.rerun) {
      needsRun = true;
    }

    // we need to build if our dependencies needs to build
    for (const depWorkspace of workspace.getRecursiveWorkspaceDependencies()) {
      if (this.checkIfRunIsRequiredCache[depWorkspace.relativeCwd] === true) {
        needsRun = true;
        break;
      }
    }

    const workspaceConfiguration = getWorkspaceConfiguration(
      workspace.manifest.raw
    );
    const useExplicitInputPaths = workspaceConfiguration?.input != null;
    const useExplicitOutputPaths = workspaceConfiguration?.output != null;
    const useExplicitTsConfig = workspaceConfiguration.tsconfig != null;

    const inputPaths = new Set<string>();
    const ignoredInputPaths = new Set<string>();
    const baseInputPaths =
      workspaceConfiguration.input ?? this.pluginConfiguration.folders.input;

    Array.isArray(baseInputPaths)
      ? baseInputPaths.forEach((p: string) => p && inputPaths.add(p))
      : inputPaths.add(baseInputPaths);

    const outputPaths = new Set<string>();
    const baseOutputPaths = workspaceConfiguration.output ?? [];

    Array.isArray(baseOutputPaths)
      ? baseOutputPaths.forEach((p) => p && outputPaths.add(p))
      : outputPaths.add(baseOutputPaths);

    if (!useExplicitOutputPaths) {
      // Check for conventional artifact folders in package.json
      if (typeof workspace?.manifest?.raw?.bin === "string") {
        outputPaths.add(workspace.manifest.raw.bin);
      } else if (
        typeof workspace?.manifest?.raw?.directories?.bin === "string"
      ) {
        outputPaths.add(workspace.manifest.raw.directories.bin);
      } else if (typeof workspace?.manifest?.raw?.files === "string") {
        outputPaths.add(workspace.manifest.raw.files);
      } else if (Array.isArray(workspace?.manifest?.raw?.files)) {
        workspace.manifest.raw.files.forEach((p) => p && outputPaths.add(p));
      } else if (typeof workspace?.manifest?.raw?.main === "string") {
        outputPaths.add(workspace.manifest.raw.main);
      }
    }

    // check for a tsconfig.json # 170
    if (
      !useExplicitInputPaths ||
      !useExplicitOutputPaths ||
      useExplicitTsConfig
    ) {
      try {
        const tsconfigFile = workspaceConfiguration.tsconfig ?? "tsconfig.json";
        const tsconfigAbsolutePath = xfs.pathUtils.join(
          workspace.cwd,
          npath.toPortablePath(tsconfigFile)
        );
        const tsconfigExists = await xfs.existsPromise(tsconfigAbsolutePath);

        if (tsconfigExists) {
          // parse tsconfig for output, input
          const tsconfig = parseTsconfig(tsconfigAbsolutePath);
          const tsConfigAbsoluteDirPath = ppath.dirname(tsconfigAbsolutePath);

          if (tsconfig.compilerOptions?.incremental) {
            // note: tsbuildinfo needs to be resolved from tsconfig
            const tsBuildInfoFile =
              tsconfig.compilerOptions.tsBuildInfoFile ??
              `${ppath.basename(
                tsconfigAbsolutePath,
                ppath.extname(tsconfigAbsolutePath)
              )}.tsbuildinfo`;
            const tsBuildInfoAbsoluteFilePath = ppath.join(
              tsConfigAbsoluteDirPath,
              npath.toPortablePath(tsBuildInfoFile)
            );
            const tsBuildInfoRelativeFilePath = ppath.relative(
              workspace.cwd,
              tsBuildInfoAbsoluteFilePath
            );

            ignoredInputPaths.add(tsBuildInfoRelativeFilePath);
          }

          if (!useExplicitInputPaths || useExplicitTsConfig) {
            tsconfig.include?.forEach((file) => {
              // include contains relative file paths which needs to be resolved from tsconfig
              const absoluteFilePath = ppath.join(
                tsConfigAbsoluteDirPath,
                npath.toPortablePath(file)
              );
              const realtiveFilePath = ppath.relative(
                workspace.cwd,
                absoluteFilePath
              );

              inputPaths.add(realtiveFilePath);
            });

            tsconfig.exclude?.forEach((file) => {
              // exclude contains relative file paths which needs to be resolved from tsconfig
              // this paths will reduce the paths from include
              const absoluteFilePath = ppath.join(
                tsConfigAbsoluteDirPath,
                npath.toPortablePath(file)
              );
              const realtiveFilePath = ppath.relative(
                workspace.cwd,
                absoluteFilePath
              );

              ignoredInputPaths.add(realtiveFilePath);
            });
          }

          if (
            (!useExplicitOutputPaths || useExplicitTsConfig) &&
            tsconfig.compilerOptions?.outDir != null
          ) {
            // outDir directs to relative output folder which needs to be resolved from tsconfig
            const absoluteFilePath = ppath.join(
              tsConfigAbsoluteDirPath,
              npath.toPortablePath(
                npath.toPortablePath(tsconfig.compilerOptions.outDir)
              )
            );
            const realtiveFilePath = ppath.relative(
              workspace.cwd,
              absoluteFilePath
            );

            outputPaths.add(realtiveFilePath);
          }
        }
      } catch (err) {
        console.warn(workspace.relativeCwd, "\n", err);
      }
    }

    // only add default output path if we didn't find anything, yet
    if (outputPaths.size === 0) {
      Array.isArray(this.pluginConfiguration.folders.output)
        ? this.pluginConfiguration.folders.output.forEach(
            (p) => p && outputPaths.add(p)
          )
        : outputPaths.add(this.pluginConfiguration.folders.output);
    }

    // Traverse the dirs and see if they've been modified
    {
      const ignorePaths = [
        ...new Set(["node_modules", ...outputPaths, ...ignoredInputPaths]),
      ].map((p) => npath.toPortablePath(p));
      const srcPaths = [...inputPaths].map((p) => npath.toPortablePath(p));

      const release = await this.runReport.mutex.acquire();

      try {
        const currentHash = await getHashForPaths(
          workspace.cwd,
          srcPaths,
          ignorePaths
        );

        if (previousRunLog?.checksum !== currentHash) {
          needsRun = true;
        }

        // #171 check if the output paths exist
        // if any don't, we need to rebuild
        if (!needsRun) {
          const outputPatternsCheck = await Promise.all(
            [...outputPaths].map(async (op) => {
              try {
                // note: we need to check every pattern/Path to ensure each return at least one result
                const paths = await globby(op, {
                  dot: true,
                  cwd: workspace.cwd,
                });

                return paths.length === 0;
              } catch {
                return false;
              }
            })
          );

          if (outputPatternsCheck.some((v) => v === true)) {
            needsRun = true;
          }
        }

        this.runLog?.set(`${workspace.relativeCwd}#${this.runCommand}`, {
          checksum: currentHash,
          status: needsRun ? RunStatus.succeeded : RunStatus.pending,
          rerun: needsRun,
          command: this.runCommand,
        });
      } catch (e) {
        this.runReport.workspaces[workspace.relativeCwd]?.stderr.push(
          new Error(
            `${workspace.relativeCwd}: failed to get lastModified (${e})`
          )
        );
      } finally {
        release();
      }
    }

    this.checkIfRunIsRequiredCache[workspace.relativeCwd] = needsRun;

    return needsRun;
  }

  performDryRun = async (ctx: Context): Promise<string> =>
    await this.tracer.startSpan(
      { name: "performDryRun", ctx },
      async ({ ctx }) => {
        const originalConcurrency = this.concurrency;

        // set concurrency to 1 to get an accurate printout
        this.concurrency = 1;

        let output = "";

        const tree: { [depth: number]: string[] } = { 1: [] };

        this.runGraph.dryRunCallback = (node: Node, iteration: number) => {
          if (!tree[iteration]) {
            tree[iteration] = [node.id];
          } else {
            tree[iteration].push(node.id);
          }
        };

        await this.runGraph.run(ctx, Array.from(this.entrypoints), true);

        const printer = (
          depth: number,
          msg: string,
          lastLevel: boolean,
          final: boolean
        ): string => {
          const joiner = lastLevel ? "└─" : final && lastLevel ? "└─┬─" : "├─";
          const indent = depth == 0 ? "" : "  ".repeat(depth);

          return `${indent}${joiner}[${depth}] ${msg}`;
        };

        const treekeys = Object.keys(tree);

        treekeys.forEach((depthStr, i) => {
          const depth = parseInt(depthStr);
          const level = tree[depth];

          const finalLevel = i == treekeys.length - 1;

          level.forEach((id, i) => {
            const wrk = this.runGraph.getNode(id);

            output += printer(depth, id, i == level.length - 1, finalLevel);

            if (wrk instanceof Node) {
              if (wrk.skip) {
                output += `(skip)`;
              }
            }

            output += "\n";
          });
        });

        this.concurrency = originalConcurrency;

        return output;
      }
    );

  run = async (ctx: Context): Promise<boolean> =>
    await this.tracer.startSpan(
      { name: "command supervisor run", ctx },
      async ({ ctx }) => {
        let output = "";

        if (this.hasSetup === false) {
          throw new Error(
            "RunSupervisor is not setup, you need to call await supervisor.setup()"
          );
        }

        this.runReport.runStart = Date.now();

        if (isCI || this.dryRun) {
          output += `${this.formatHeader("Run Order") + "\n"}`;
          output += await this.performDryRun(ctx);

          if (!isCI) {
            output += `${
              this.formatHeader(
                `Dry Run / Command: ${this.runCommand} / Total: ${this.runGraph.runSize}`,
                0,
                true
              ) + "\n"
            }`;
          }
          process.stdout.write(output);
          output = "";

          if (this.dryRun) {
            return true;
          }
        }

        // Print our RunReporter output
        if (!isCI) {
          Hansi.pad(this.concurrency + 3); // ensure we have the space we need (required if we start near the bottom of the display).
        }

        if (isCI) {
          process.stdout.write(
            `\n${
              this.formatHeader(
                `Run / Command: ${this.runCommand} / Concurrency: ${this.concurrency}`,
                0,
                false
              ) + "\n"
            }`
          );
        }

        // print progress
        this.raf(this.waitUntilDone);

        this.currentRunTarget =
          this.runTargets.length > 1
            ? "All"
            : this.runTargets[0]?.relativeCwd ?? "Nothing to run";

        // theres an off by one error in the RunLog
        if (!isCI) {
          process.stderr.write("\n");
        }

        this.header = this.generateHeaderString();

        // run
        await this.runGraph.run(ctx, Array.from(this.entrypoints));

        const releaseMutex = await this.runReport.mutex.acquire();

        this.runReport.done = true;

        releaseMutex();

        const finalLine = this.generateFinalReport();

        if (typeof finalLine === `string`) {
          process.stdout.write(`\n${finalLine}\n`);
        }

        // commit the run log
        await this.saveRunLog();

        return this.runReport.failCount === 0;
      }
    );

  // This is a very simple requestAnimationFrame polyfil
  raf = (f: (timestamp: number) => void): void => {
    setImmediate(() => f(Date.now()));
  };

  waitUntilDone = (timestamp: number): void => {
    if (this.runReport.done) {
      return;
    }

    const waitTime = 90;
    let output = "";

    if (isCI) {
      this.updateProgressCI(timestamp);
    } else {
      output = this.generateProgressString(timestamp);

      Hansi.cursorUp(
        Hansi.linesRequired(
          this.runReport.previousOutput,
          process.stdout.columns
        )
      );
      Hansi.clearScreenDown();
    }

    if (typeof output != `undefined` && typeof output === `string`) {
      process.stdout.write(output);
    }

    this.runReport.previousOutput = output;

    delay(waitTime).then(() => {
      this.raf(this.waitUntilDone);
    });
  };

  grey = (s: string): string =>
    formatUtils.pretty(this.configuration, s, `grey`);

  formatHeader(name: string, depth = 0, withBrand = false): string {
    const label = `${this.grey("-".repeat(depth) + "[")} ${name} ${this.grey(
      "]"
    )}`;
    const length = stripAnsi(label).length;
    const brand = withBrand ? "[ yarn.build ]" : "";
    let repeat = DIVIDER_LENGTH - length;

    if (withBrand) {
      repeat -= brand.length;
    }

    return label + this.grey("-".repeat(repeat)) + this.grey(brand);
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

  updateRuntime(timestamp: number): void {
    for (const relativePath in this.runReport.workspaces) {
      const thread = this.runReport.workspaces[relativePath];

      if (!thread || !thread.start || thread.done) {
        continue;
      }
      if (!!this.runReport.runStart) {
        this.runReport.workspaces[relativePath].runtimeSeconds =
          timestamp - thread.start;
      }
    }
  }

  updateProgressCI(timestamp: number): void {
    this.updateRuntime(timestamp);
  }

  generateProgressString(timestamp: number): string {
    let output = "";

    const generateIndexString = (s: number) => this.grey(`[${s}]`);

    const idleString = formatUtils.pretty(this.configuration, `IDLE`, `grey`);

    output += this.formatHeader(this.generateHeaderString()) + "\n";

    this.updateRuntime(timestamp);

    let i = 1;

    for (const relativePath in this.runReport.workspaces) {
      const thread = this.runReport.workspaces[relativePath];

      if (!thread || !thread.start || thread.done) {
        continue;
      }

      const pathString = formatUtils.pretty(
        this.configuration,
        relativePath,
        FormatType.PATH
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

      let outputString = `${indexString} ${referenceString}${formatUtils.pretty(
        this.configuration,
        "@",
        "grey"
      )}${pathString} ${runScriptString} ${timeString}\n`;

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
          )}`,
          0,
          true
        ) + `\n`;
    }

    return output;
  };

  generateFinalReport = (): string => {
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

    let printOutput = false;
    let output = "";

    // Check if there were errors, and print them out
    if (this.runReport.failCount !== 0) {
      printOutput = true;
    }

    if (this.verbose) {
      printOutput = true;
    }

    if (isCI) {
      printOutput = true;
    }

    if (printOutput) {
      const packagesWithErrors: string[] = [];

      output += `${this.formatHeader(this.header) + "\n"}`;

      // print out any build errors
      for (const relativePath in this.runReport.workspaces) {
        const workspace = this.runReport.workspaces[relativePath];

        if (workspace.fail) {
          packagesWithErrors.push(relativePath);
        }

        if (this.runReport.failCount !== 0 && workspace.fail === false) {
          continue;
        }

        if (workspace.stdout.length !== 0 || workspace.stderr.length !== 0) {
          const lineHeader = this.formatHeader(
            `Output: ${formatUtils.pretty(
              this.configuration,
              relativePath,
              FormatType.PATH
            )}`,
            2
          );

          output += `\n${lineHeader + "\n"}`;
        }

        if (workspace.stdout.length !== 0) {
          workspace.stdout.forEach((m) => {
            const lines = m.split("\n");

            lines.forEach((line) => {
              if (typeof line != `undefined` && line.length !== 0) {
                output += `${line + "\n"}`;
              }
            });
          });
        }

        if (workspace.stderr.length !== 0) {
          // stderr doesnt seem to be useful for showing to the user in cli
          // we'll still write it out to the run log
          const lineHeader = `[stderr]`;

          output += `\n${lineHeader + "\n"}`;

          workspace.stderr.forEach((e) => {
            const err = e instanceof Error ? e.toString() : `${e}`;
            const lines = err.split("\n");

            lines.forEach((line) => {
              if (typeof line !== `undefined` && line.length !== 0) {
                output += `${line + "\n"}`;
              }
            });
          });
        }
      }

      if (packagesWithErrors.length >= 2) {
        output += `${this.grey(DIVIDER) + "\n"}`;
        const errorHeader = this.grey(
          `ERROR for script ${this.header}\nThe following packages returned an error.\n`
        );

        output += `${errorHeader}`;

        packagesWithErrors.forEach((relativePath) => {
          const lineTail = `- ${formatUtils.pretty(
            this.configuration,
            relativePath,
            FormatType.PATH
          )}`;

          output += `${lineTail + "\n"}`;
        });
      }
    }

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
        }`,
        0,
        true
      ) + "\n";

    output += "\n" + this.formatHeader("Summary") + "\n";

    if (this.runReport.runStart) {
      const { successCount, failCount, ignoredCount, skipCount } =
        this.runReport;

      const total = this.runGraph.runSize - ignoredCount;

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
      const excludedString = formatUtils.pretty(
        this.configuration,
        `Excluded: ${this.excluded.size}`,
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

      output += successString + "\n";

      output += upToDateString + "\n";

      output += failedString + "\n";
      if (this.verbose && failCount > 0) {
        Object.keys(this.runReport.workspaces).forEach((k) => {
          const w = this.runReport.workspaces[k];

          if (w.fail) {
            output += ` - ${formatUtils.pretty(
              this.configuration,
              k,
              "grey"
            )}${formatUtils.pretty(this.configuration, w.locator, "IDENT")}\n`;
          }
        });
      }
      output += skippedString + "\n";
      if (this.verbose && skipCount > 0) {
        Object.keys(this.runReport.workspaces).forEach((k) => {
          const w = this.runReport.workspaces[k];

          if (w.skipped) {
            output += ` - ${formatUtils.pretty(
              this.configuration,
              k,
              "grey"
            )}${formatUtils.pretty(this.configuration, w.locator, "IDENT")}\n`;
          }
        });
      }

      output += excludedString + "\n";
      if (this.verbose && this.excluded.size > 0) {
        for (const w of this.excluded) {
          output += ` - ${formatUtils.pretty(
            this.configuration,
            w.relativeCwd,
            "grey"
          )}${formatUtils.pretty(this.configuration, w.locator, "IDENT")}\n`;
        }
      }

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

      output += `Cumulative: (cpu): ${formatTimestampDifference(0, totalMs)}\n`;
      output += `Saved: ${savedTime}\n`;
    }

    if (!!this.runReport.runStart) {
      output +=
        `Runtime (wall): ` +
        formatTimestampDifference(Date.now(), this.runReport.runStart) +
        `\n`;
    }
    output += heading;

    output += "\n";

    return output;
  };

  // Setup a run item, that will execute the run command when it's time comes
  createRunItem = (workspace: Workspace): RunCallback => {
    // return a PQueue item
    return async (ctx: Context, cancelDependentJobs: () => void) =>
      // limit to max concurrency
      await this.limit(
        // pass an async callback that will execute the run command
        async (): Promise<boolean> =>
          // wrap our callback in an otel span
          this.tracer.startSpan(
            { name: "command", ctx },
            // pass one more async callback to the span, this one runs the command
            async ({ span, ctx }) => {
              const prefix = workspace.relativeCwd;

              const attr = {
                [Attribute.PACKAGE_NAME]: workspace.locator.name,
                [Attribute.PACKAGE_DIRECTORY]: workspace.relativeCwd,
                [Attribute.PACKAGE_COMMAND]: this.runCommand,
              };

              if (typeof workspace.locator.scope === "string") {
                attr[Attribute.PACKAGE_SCOPE] = `@${workspace.locator.scope}`;
              }

              const command = workspace.manifest.scripts.get(this.runCommand);

              if (typeof command === "string") {
                attr[Attribute.YARN_BUILD_PACKAGE_RUN_COMMAND] = command;
              }

              const currentRunLog = this.runLog?.get(
                `${workspace.relativeCwd}#${this.runCommand}`
              );

              this.runReporter.emit(
                RunSupervisorReporterEvents.start,
                workspace.relativeCwd,
                workspace.locator,
                `${
                  workspace.manifest.name?.scope
                    ? `@${workspace.manifest.name?.scope}/`
                    : ""
                }${workspace.manifest.name?.name}`,
                command
              );
              span.addEvent("start");

              span.setAttributes(attr);

              if (!command) {
                if (this.verbose) {
                  this.runReporter.emit(
                    RunSupervisorReporterEvents.info,
                    workspace.relativeCwd,
                    `[skip] No \`${this.runCommand}\` script in manifest.`
                  );
                }

                this.runReporter.emit(
                  RunSupervisorReporterEvents.ignored,
                  workspace.relativeCwd
                );
                span.addEvent("ignored");

                return true;
              }

              try {
                if (this.runReport.failCount !== 0 && !this.continueOnError) {
                  // We have bailed skip all!
                  this.runReporter.emit(
                    RunSupervisorReporterEvents.skipped,
                    workspace.relativeCwd
                  );
                  span.addEvent("skipped");

                  this.runLog?.set(
                    `${workspace.relativeCwd}#${this.runCommand}`,
                    {
                      checksum: currentRunLog?.checksum,
                      status: RunStatus.skipped,
                      rerun: false,
                      command: this.runCommand,
                    }
                  );
                  span.addEvent("runReport failcount is not 0, exiting early");

                  if (this.continueOnError === false) {
                    return false;
                  }
                }

                const exitCode = await this.cli(
                  ctx,
                  this.runCommand,
                  workspace.cwd,
                  this.runReporter,
                  prefix
                );

                span.setAttribute(
                  Attribute.YARN_BUILD_PACKAGE_RUN_COMMAND_EXIT,
                  exitCode
                );

                if (exitCode !== 0) {
                  this.runReporter.emit(
                    RunSupervisorReporterEvents.fail,
                    workspace.relativeCwd
                  );

                  this.runLog?.set(
                    `${workspace.relativeCwd}#${this.runCommand}`,
                    {
                      checksum: currentRunLog?.checksum,
                      status: RunStatus.failed,
                      rerun: true,
                      command: this.runCommand,
                      exitCode: `${exitCode}`,
                    }
                  );

                  if (this.failFast === true) {
                    if (isCI) {
                      process.stdout.write(
                        "--fail-fast is set, terminating all processes\n"
                      );
                    }
                    void terminateAllChildProcesses();
                  }

                  return false;
                }

                // run was a success
                this.runLog?.set(
                  `${workspace.relativeCwd}#${this.runCommand}`,
                  {
                    checksum: currentRunLog?.checksum,
                    status: RunStatus.succeeded,
                    rerun: false,
                    command: this.runCommand,
                  }
                );

                this.runReporter.emit(
                  RunSupervisorReporterEvents.success,
                  workspace.relativeCwd
                );
              } catch (err) {
                this.runReporter.emit(
                  RunSupervisorReporterEvents.fail,
                  workspace.relativeCwd,
                  err
                );

                this.runLog?.set(
                  `${workspace.relativeCwd}#${this.runCommand}`,
                  {
                    checksum: currentRunLog?.checksum,
                    status: RunStatus.failed,
                    rerun: true,
                    command: this.runCommand,
                  }
                );
                if (typeof err === "string" || err instanceof Error) {
                  span.recordException(err);
                }
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: "Command failed",
                });

                if (this.continueOnError === false) {
                  cancelDependentJobs();
                  terminateAllChildProcesses();

                  return false;
                }

                return false;
              }

              return false;
            }
          )
      );
  };
}

const getHashForPaths = async (
  cwd: PortablePath,
  paths: PortablePath[],
  ignored: PortablePath[] | undefined
): Promise<string> => {
  const allFilePaths = await globby(paths, {
    cwd: cwd,
    absolute: true,
    expandDirectories: true,
    dot: true,
    ignore: ignored,
  });

  allFilePaths.sort();

  const fileDetails = await Promise.all(
    allFilePaths.map(async (p) => {
      const filePath = npath.toPortablePath(p);
      const stat = await xfs.statPromise(filePath);

      return {
        path: ppath.relative(cwd, filePath),
        size: stat.isFile() ? stat.size : 0,
        lastModified: stat.isFile() ? stat.mtimeMs : 0,
      };
    })
  );

  return objectHash(fileDetails);
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

export { RunSupervisor, RunSupervisorReporterEvents, RunCommandCli };
