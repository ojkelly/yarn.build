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

import { EventEmitter } from "events";
import { GetPluginConfiguration } from "@ojkelly/yarn-build-shared/src/config";
import RunSupervisor, {
  RunSupervisorReporterEvents,
} from "@ojkelly/yarn-build-shared/src/supervisor";

import { addTargets } from "@ojkelly/yarn-build-shared/src/supervisor/workspace";
import { terminateProcess } from "@ojkelly/yarn-build-shared/src/supervisor/terminate";

export default class Build extends BaseCommand {
  static paths = [[`build`]];

  json = Option.Boolean(`--json`, false, {
    description: `flag is set the output will follow a JSON-stream output
      also known as NDJSON (https://github.com/ndjson/ndjson-spec).`,
  });

  all = Option.Boolean(`-A,--all`, false, {
    description: `Build all workspaces of a project`,
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
    description: `is the maximum number of builds that can run at a time, defaults to the number of logical CPUs on the current machine. Will override the global config option.`,
  });

  shouldBailInstantly = Option.Boolean("--bail", false, {
    description: `exit immediately upon build failing`,
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

  async execute(): Promise<0 | 1> {
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

    const rootWorkspace = this.all ? project.topLevelWorkspace : cwdWorkspace;

    const rootCandidates = [
      rootWorkspace,
      ...(this.buildTargets.length > 0
        ? rootWorkspace.getRecursiveWorkspaceChildren()
        : []),
    ];

    const buildTargetPredicate = (workspace: Workspace) =>
      this.buildTargets.some(
        (t) =>
          micromatch.isMatch(
            structUtils.stringifyIdent(workspace.locator),
            t
          ) ||
          micromatch.isMatch(
            workspace.cwd,
            `${configuration.projectCwd}${path.posix.sep}${t}`
          )
      );

    const buildTargetCandidates: Array<Workspace> =
      this.buildTargets.length > 0
        ? rootCandidates.filter(buildTargetPredicate)
        : rootCandidates;

    const pluginConfiguration = await GetPluginConfiguration(configuration);

    this.shouldBailInstantly =
      this.shouldBailInstantly ?? pluginConfiguration.bail;

    this.shouldBailInstantly =
      this.shouldBailInstantly ?? pluginConfiguration.bail;

    // Safe to run because the input string is validated by clipanion using the schema property
    // TODO: Why doesn't the Command validation cast this for us?
    const maxConcurrency =
      this.maxConcurrency === undefined
        ? pluginConfiguration.maxConcurrency
        : parseInt(this.maxConcurrency);

    const report = await StreamReport.start(
      {
        configuration,
        json: this.json,
        stdout: this.context.stdout,
        includeLogs: true,
      },
      async (report: StreamReport) => {
        const runScript = async (
          command: string,
          cwd: PortablePath,
          buildReporter: EventEmitter,
          prefix: string
        ) => {
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
          } catch (err) {
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
          cli: runScript,
          dryRun: this.dryRun,
          ignoreRunCache: this.ignoreBuildCache,
          verbose: this.verbose,
          concurrency: maxConcurrency,
          shouldBailInstantly: this.shouldBailInstantly,
        });

        supervisor.runReporter.on(RunSupervisorReporterEvents.forceQuit, () => {
          this.forceQuit = true;
        });

        await supervisor.setup();

        for (const targetWorkspace of buildTargetCandidates) {
          await addTargets({ targetWorkspace, project, supervisor });
        }

        // build all the things
        const ranWithoutErrors = await supervisor.run();

        if (ranWithoutErrors === false) {
          report.reportError(MessageName.BUILD_FAILED, "Build failed");
        }
      }
    );

    terminateProcess.hasBeenTerminated = true;

    return report.exitCode();
  }
}
