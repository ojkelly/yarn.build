import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  MessageName,
  Project,
  StreamReport,
  miscUtils,
  Workspace,
  structUtils,
} from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";
import { Command, Option, Usage } from "clipanion";
import path from "path";
import micromatch from "micromatch";
import { cpus } from "os";

import { EventEmitter } from "events";
import { GetPluginConfiguration } from "@ojkelly/yarn-build-shared/src/config";
import RunSupervisor, {
  RunSupervisorReporterEvents,
  RunCommandCli,
} from "@ojkelly/yarn-build-shared/src/supervisor";

import { GetChangedWorkspaces } from "@ojkelly/yarn-build-shared/src/changes";

import { addTargets } from "@ojkelly/yarn-build-shared/src/supervisor/workspace";
import { terminateProcess } from "@ojkelly/yarn-build-shared/src/supervisor/terminate";

import { SpanStatusCode, Context, trace } from "@opentelemetry/api";

import { Tracer, Attribute } from "@ojkelly/yarn-build-shared/src/tracing";

export default class Build extends BaseCommand {
  static paths = [[`build`]];

  json = Option.Boolean(`--json`, false, {
    description: `flag is set the output will follow a JSON-stream output
      also known as NDJSON (https://github.com/ndjson/ndjson-spec).`,
  });

  all = Option.Boolean(`-A,--all`, false, {
    description: `run for all workspaces of a project`,
  });

  buildCommand = Option.String(`-c,--build-command`, `build`, {
    description: `the command to be run in each package (if available), defaults to "build"`,
  });

  interlaced = Option.Boolean(`-i,--interlaced`, true, {
    description: `If false it will instead buffer the output from each process and print the resulting buffers only after their source processes have exited. Defaults to false.`,
  });

  verbose = Option.Boolean(`-v,--verbose`, false, {
    description: `more information will be logged to stdout than normal.`,
  });

  dryRun = Option.Boolean(`-d,--dry-run`, false, {
    description: `simulate running a build, but not actually run it`,
  });

  ignoreBuildCache = Option.Boolean(`-r,--ignore-cache`, false, {
    description: `every package will be built, regardless of whether is has changed or not.`,
  });

  maxConcurrency = Option.String(`-m,--max-concurrency`, {
    description: `is the maximum number of builds that can run at a time, defaults to the number of logical CPUs on the current machine.`,
  });

  continueOnError = Option.Boolean("--continue-on-error", false, {
    description: `if a build fails, continue with the rest`,
  });

  exclude = Option.Array(`--exclude`, {
    description: `exclude specifc packages or glob paths from being built, including their dependencies.`,
  });

  excludeCurrent = Option.Boolean("--exclude-current", false, {
    description: `build this workspaces dependencies, but not this workspace. Useful for running as part of a \`dev\` command.`,
  });

  onlyGitChanges = Option.Boolean("--changes", false, {
    description: `only build packages that were changed in the last commit`,
  });

  onlyGitChangesSinceCommit = Option.String("--since", {
    description: `only build packages that were changed since the given commit`,
  });

  onlyGitChangesSinceBranch = Option.String("--since-branch", {
    description: `only build packages that have changes compared to the give branch. Uses 'git diff --name-only branch...'`,
    arity: 1,
  });

  onlyCurrent = Option.Boolean("--only-current", false, {
    description: `only build the current workspace`,
  });

  public buildTargets = Option.Rest({ name: "workspaceNames" });

  static usage: Usage = Command.Usage({
    category: `Build commands`,
    description: `build a package and all its dependencies`,
    details: `
      In a monorepo with internal packages that depend on others, this command
      will traverse the dependency graph and efficiently ensure, the packages
      are built in the right order.

    `,
  });

  forceQuit = false;

  // Keep track of what is built, and if it needs to be rebuilt
  buildLog: { [key: string]: { hash: string | undefined } } = {};

  commandType: "build" | "test" = "build";

  async execute(): Promise<0 | 1> {
    const tracer = new Tracer("yarn.build");

    return await tracer.startSpan(
      { name: `yarn ${this.commandType}`, propegateFromEnv: true },
      async ({ span: rootSpan, ctx }) => {
        rootSpan.setAttributes({
          [Attribute.YARN_BUILD_FLAGS_OUTPUT_JSON]: this.json,
          [Attribute.YARN_BUILD_FLAGS_ALL]: this.all,
          [Attribute.YARN_BUILD_FLAGS_TARGETS]: this.buildTargets,
          [Attribute.YARN_BUILD_FLAGS_COMMAND]: this.buildCommand,
          [Attribute.YARN_BUILD_FLAGS_INTERLACED]: this.interlaced,
          [Attribute.YARN_BUILD_FLAGS_VERBOSE]: this.verbose,
          [Attribute.YARN_BUILD_FLAGS_DRY_RUN]: this.dryRun,
          [Attribute.YARN_BUILD_FLAGS_IGNORE_CACHE]: this.ignoreBuildCache,
          [Attribute.YARN_BUILD_FLAGS_MAX_CONCURRENCY]: this.maxConcurrency,
          [Attribute.YARN_BUILD_FLAGS_CONTINUE_ON_ERROR]: this.continueOnError,
          [Attribute.YARN_BUILD_FLAGS_EXCLUDE]: this.exclude,
          [Attribute.YARN_BUILD_FLAGS_EXCLUDE_CURRENT]: this.excludeCurrent,
          [Attribute.YARN_BUILD_FLAGS_CHANGES]: this.onlyGitChanges,
          [Attribute.YARN_BUILD_FLAGS_SINCE]: this.onlyGitChangesSinceCommit,
          [Attribute.YARN_BUILD_FLAGS_SINCE_BRANCH]:
            this.onlyGitChangesSinceBranch,
          [Attribute.YARN_BUILD_FLAGS_ONLY_CURRENT]: this.onlyCurrent,
        });

        const configuration = await Configuration.find(
          this.context.cwd,
          this.context.plugins
        );
        const { project, workspace: cwdWorkspace } = await Project.find(
          configuration,
          this.context.cwd
        );

        if (!cwdWorkspace)
          throw new WorkspaceRequiredError(project.cwd, this.context.cwd);

        const rootWorkspace = this.all
          ? project.topLevelWorkspace
          : cwdWorkspace;

        // #203 limit onlyCurrent when isRoot is true
        let isRoot = false;

        if (rootWorkspace == project.topLevelWorkspace) {
          isRoot = true;
        }

        let rootCandidates = [
          rootWorkspace,
          ...(this.buildTargets.length > 0
            ? rootWorkspace.getRecursiveWorkspaceChildren()
            : []),
        ];

        if (typeof this.onlyGitChangesSinceBranch === `string`) {
          rootCandidates = await GetChangedWorkspaces({
            root: project.topLevelWorkspace,
            sinceBranch: this.onlyGitChangesSinceBranch,
          });
        } else if (this.onlyGitChanges || this.onlyGitChangesSinceCommit) {
          rootCandidates = await GetChangedWorkspaces({
            root: project.topLevelWorkspace,
            commit: this.onlyGitChangesSinceCommit ?? "1",
          });
        }

        if (!Array.isArray(this.exclude)) {
          this.exclude = [];
        }

        if (!!this.excludeCurrent) {
          this.exclude.push(structUtils.stringifyIdent(cwdWorkspace.locator));
        }

        if (!isRoot && this.onlyCurrent) {
          // when building 1 workspace, we only need 1 worker
          this.maxConcurrency = "1";
        }

        const excludeWorkspacePredicate = (targetWorkspace: Workspace) => {
          // #168 limit to only the current workspace
          if (!isRoot && this.onlyCurrent) {
            return targetWorkspace != cwdWorkspace;
          }

          return (
            this.exclude?.some(
              (t) =>
                micromatch.isMatch(
                  structUtils.stringifyIdent(targetWorkspace.locator),
                  t
                ) ||
                micromatch.isMatch(
                  targetWorkspace.cwd,
                  `${configuration.projectCwd}${path.posix.sep}${t}`
                )
            ) ?? false
          );
        };

        const buildTargetPredicate = (targetWorkspace: Workspace) => {
          // #168 limit to only the current workspace
          if (!isRoot && this.onlyCurrent) {
            return targetWorkspace == cwdWorkspace;
          }

          return this.buildTargets.some((t) => {
            // match on @scope/name
            return (
              micromatch.isMatch(
                structUtils.stringifyIdent(targetWorkspace.locator),
                t
              ) ||
              // match on path
              micromatch.isMatch(
                targetWorkspace.cwd,
                `${configuration.projectCwd}${path.posix.sep}${t}`
              )
            );
          });
        };

        const buildTargetCandidates: Array<Workspace> =
          this.buildTargets.length > 0
            ? rootCandidates.filter(buildTargetPredicate)
            : rootCandidates;

        const pluginConfiguration = await GetPluginConfiguration(configuration);

        this.continueOnError =
          this.continueOnError ?? !!pluginConfiguration.bail;

        // Safe to run because the input string is validated by clipanion using the schema property
        // TODO: Why doesn't the Command validation cast this for us?
        const maxConcurrency =
          this.maxConcurrency === undefined
            ? cpus().length
            : parseInt(this.maxConcurrency);

        rootSpan.setAttributes({
          [Attribute.YARN_BUILD_CONFIG_FOLDERS_INPUT]:
            pluginConfiguration.folders.input,
          [Attribute.YARN_BUILD_CONFIG_FOLDERS_OUTPUT]:
            pluginConfiguration.folders.output,
          [Attribute.YARN_BUILD_CONFIG_EXCLUDE]: pluginConfiguration.exclude,
          [Attribute.YARN_BUILD_CONFIG_BAIL]: pluginConfiguration.bail,
          [Attribute.YARN_BUILD_CONFIG_HIDE_BADGE]:
            pluginConfiguration.hideYarnBuildBadge,
          [Attribute.YARN_BUILD_CONFIG_MAX_CONCURRENCY]:
            maxConcurrency,
        });

        const report = await StreamReport.start(
          {
            configuration,
            json: this.json,
            stdout: this.context.stdout,
            includeLogs: true,
          },
          async (report: StreamReport) => {
            // Closure holding our function to run each package command
            const command: RunCommandCli = async (
              ctx: Context,
              command: string,
              cwd: PortablePath,
              buildReporter: EventEmitter,
              prefix: string
            ): Promise<number> => {
              const span = trace.getSpan(ctx);
              const stdout = new miscUtils.BufferStream();

              stdout.on("data", (chunk) =>
                buildReporter?.emit(
                  RunSupervisorReporterEvents.info,
                  prefix,
                  chunk && chunk.toString()
                )
              );

              const stderr = new miscUtils.BufferStream();

              stderr.on("data", (chunk) =>
                buildReporter?.emit(
                  RunSupervisorReporterEvents.error,
                  prefix,
                  chunk && chunk.toString()
                )
              );
              if (this.forceQuit) {
                stdout.destroy();
                stderr.destroy();
                stdout.end();
                stderr.end();

                return 2;
              }
              try {
                const exitCode =
                  (await this.cli.run(["run", command], {
                    cwd,
                    stdout,
                    stderr,
                  })) || 0;

                stdout.end();
                stderr.end();

                return exitCode;
              } catch (err: unknown) {
                span?.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: (err as Error).message,
                });
                if (typeof err === "string" || err instanceof Error) {
                  span?.recordException(err);
                }
                stdout.end();
                stderr.end();
              }

              return 2;
            };

            const supervisor = new RunSupervisor({
              project,
              configuration,
              pluginConfiguration,
              report,
              runCommand: this.buildCommand,
              cli: command,
              dryRun: this.dryRun,
              ignoreRunCache: this.ignoreBuildCache,
              verbose: this.verbose,
              concurrency: maxConcurrency,
              continueOnError: this.continueOnError,
              excludeWorkspacePredicate,
            });

            supervisor.runReporter.on(
              RunSupervisorReporterEvents.forceQuit,
              () => {
                this.forceQuit = true;
              }
            );

            await supervisor.setup();

            for (const targetWorkspace of buildTargetCandidates) {
              await addTargets({
                targetWorkspace,
                project,
                supervisor,
              });
            }

            // build all the things
            const ranWithoutErrors = await supervisor.run(ctx);

            if (ranWithoutErrors === false) {
              report.reportError(MessageName.BUILD_FAILED, "Build failed");
              rootSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: "Build failed",
              });
            }
          }
        );

        terminateProcess.hasBeenTerminated = true;

        return report.exitCode();
      }
    );
  }
}
