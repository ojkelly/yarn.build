import { BaseCommand } from "@yarnpkg/cli";
import {
  Configuration,
  MessageName,
  Project,
  StreamReport,
  miscUtils,
} from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";
import { Command, Option, Usage } from "clipanion";
import path from "path";

import { EventEmitter } from "events";
import { GetPluginConfiguration, YarnBuildConfiguration } from "../../config";
import RunSupervisor, { RunSupervisorReporterEvents } from "../supervisor";

import { addTargets } from "../supervisor/workspace";

export default class Build extends BaseCommand {
  static paths = [[`build`]];

  json = Option.Boolean(`--json`, false, {
    description: `flag is set the output will follow a JSON-stream output
      also known as NDJSON (https://github.com/ndjson/ndjson-spec).`,
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

  ignoreBuildCache = Option.Boolean(`--ignore-cache`, false, {
    description: `every package will be built, regardless of whether is has changed or not.`,
  });

  maxConcurrency = Option.String(`-m,--max-concurrency`, {
    description: `is the maximum number of builds that can run at a time, defaults to the number of logical CPUs on the current machine. Will override the global config option.`,
  });

  public buildTarget: string[] = Option.Rest();

  static usage: Usage = Command.Usage({
    category: `Build commands`,
    description: `build a package and all its dependencies`,
    details: `
      In a monorepo with internal packages that depend on others, this command
      will traverse the dependency graph and efficiently ensure, the packages
      are built in the right order.

    `,
  });

  // Keep track of what is built, and if it needs to be rebuilt
  buildLog: { [key: string]: { hash: string | undefined } } = {};

  async execute(): Promise<0 | 1> {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );

    const pluginConfiguration: YarnBuildConfiguration = await GetPluginConfiguration(
      configuration
    );

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
        let targetDirectory = this.context.cwd;

        if (typeof this.buildTarget[0] === "string") {
          targetDirectory = `${configuration.projectCwd}${path.sep}${this.buildTarget[0]}` as PortablePath;
        }

        const { project, workspace: cwdWorkspace } = await Project.find(
          configuration,
          targetDirectory
        );

        const targetWorkspace = cwdWorkspace || project.topLevelWorkspace;

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
        });

        await supervisor.setup();

        await addTargets({ targetWorkspace, project, supervisor });

        // build all the things
        const ranWithoutErrors = await supervisor.run();

        if (ranWithoutErrors === false) {
          report.reportError(MessageName.BUILD_FAILED, "Build failed");
        }
      }
    );

    return report.exitCode();
  }
}
