import { BaseCommand } from "@yarnpkg/cli";
import {
  Configuration,
  MessageName,
  Project,
  StreamReport,
  miscUtils,
} from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";
import { Command, Usage } from "clipanion";
import path from "path";
import * as yup from "yup";

import { EventEmitter } from "events";
import { GetPluginConfiguration, YarnBuildConfiguration } from "../../config";
import RunSupervisor, { RunSupervisorReporterEvents } from "../supervisor";

import { addTargets } from "../supervisor/workspace";

export default class Test extends BaseCommand {
  @Command.Boolean(`--json`)
  json = false;

  @Command.Boolean(`-v,--verbose`)
  verbose = false;

  @Command.Boolean(`--ignore-cache`)
  ignoreTestCache = false;

  @Command.String(`-m,--max-concurrency`)
  maxConcurrency: string | undefined;

  @Command.Rest()
  public runTarget: string[] = [];

  static schema = yup.object().shape({
    maxConcurrency: yup.number().integer().moreThan(0),
  });

  static usage: Usage = Command.Usage({
    category: `Test commands`,
    description: `test a package and all its dependencies`,
    details: `
      Run tests.

    `,
  });

  // Keep track of what is built, and if it needs to be rebuilt
  runLog: { [key: string]: { hash: string | undefined } } = {};

  @Command.Path(`test`)
  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );

    const pluginConfiguration: YarnBuildConfiguration = await GetPluginConfiguration(configuration);

    const report = await StreamReport.start(
      {
        configuration,
        json: this.json,
        stdout: this.context.stdout,
        includeLogs: true,
      },
      async (report: StreamReport) => {
        let targetDirectory = this.context.cwd;

        if (
          pluginConfiguration.enableBetaFeatures.targetedBuilds &&
          typeof this.runTarget[0] === "string"
        ) {
          targetDirectory = `${configuration.projectCwd}${path.sep}${this.runTarget[0]}` as PortablePath;
        }

        const { project, workspace: cwdWorkspace } = await Project.find(
          configuration,
          targetDirectory
        );

        const targetWorkspace = cwdWorkspace || project.topLevelWorkspace;

        const runScript = async (
          command: string,
          cwd: PortablePath,
          runReporter: EventEmitter,
          prefix: string
        ) => {
          const stdout = new miscUtils.BufferStream();
          stdout.on("data", (chunk) =>
            runReporter?.emit(
              RunSupervisorReporterEvents.info,
              prefix,
              chunk && chunk.toString()
            )
          );

          const stderr = new miscUtils.BufferStream();
          stderr.on("data", (chunk) =>
            runReporter?.emit(
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
          runCommand: "test",
          cli: runScript,
          dryRun: false,
          ignoreRunCache: this.ignoreTestCache,
          verbose: this.verbose,
          concurrency: maxConcurrency,
        });

        await supervisor.setup();

        await addTargets({ targetWorkspace, project, supervisor });

        // test all the things
        const ranWithoutErrors = await supervisor.run();
        if (ranWithoutErrors === false) {
          report.reportError(MessageName.BUILD_FAILED, "Test failed");
        }
      }
    );

    return report.exitCode();
  }
}
