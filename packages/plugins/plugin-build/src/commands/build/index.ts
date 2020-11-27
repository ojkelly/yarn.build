import { BaseCommand } from "@yarnpkg/cli";
import {
  Configuration,
  Manifest,
  MessageName,
  Project,
  StreamReport,
  Workspace,
  miscUtils,
} from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";
import { Command, Usage } from "clipanion";

import { EventEmitter } from "events";
import BuildSupervisor, { BuildReporterEvents } from "./supervisor";

export default class Build extends BaseCommand {
  @Command.Boolean(`--json`)
  json = false;

  @Command.String(`-c,--build-command`)
  buildCommand = "build";

  @Command.Boolean(`-p,--parallel`)
  parallel = true;

  @Command.Boolean(`-i,--interlaced`)
  interlaced = false;

  @Command.Boolean(`-v,--verbose`)
  verbose = false;

  @Command.Boolean(`-d,--dry-run`)
  dryRun = false;

  static usage: Usage = Command.Usage({
    category: `Build commands`,
    description: `build a package and all its dependencies`,
    details: `
      In a monorepo with internal packages that depend on others, this command
      will traverse the dependency graph and efficiently ensure, the packages
      are built in the right order.

      - If \`-p,--parallel\` and \`-i,--interlaced\` are both set, Yarn
      will print the lines from the output as it receives them.
      Parallel defaults to true.

      If \`-i,--interlaced\` wasn't set, it would instead buffer the output
      from each process and print the resulting buffers only after their
      source processes have exited. Defaults to false.

      If the \`--json\` flag is set the output will follow a JSON-stream output
      also known as NDJSON (https://github.com/ndjson/ndjson-spec).

      \`-c,--build-command\` is the command to be run in each package (if available), defaults to "build"
    `,
  });

  // Keep track of what is built, and if it needs to be rebuilt
  buildLog: { [key: string]: { hash: string | undefined } } = {};

  @Command.Path(`build`)
  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );

    const report = await StreamReport.start(
      {
        configuration,
        json: this.json,
        stdout: this.context.stdout,
        includeLogs: true,
      },
      async (report: StreamReport) => {
        const { project, workspace: cwdWorkspace } = await Project.find(
          configuration,
          this.context.cwd
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
              BuildReporterEvents.info,
              prefix,
              chunk && chunk.toString()
            )
          );

          const stderr = new miscUtils.BufferStream();
          stderr.on("data", (chunk) =>
            buildReporter?.emit(
              BuildReporterEvents.error,
              prefix,
              chunk && chunk.toString()
            )
          );

          try {
            const exitCode =
              (await this.cli.run(["run", "build"], {
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

        const supervisor = new BuildSupervisor({
          project,
          configuration,
          report,
          buildCommand: this.buildCommand,
          cli: runScript,
          dryRun: this.dryRun,
        });

        await supervisor.setup();

        if (targetWorkspace.workspacesCwds.size !== 0) {
          // we're in the root, need to build all
          const workspaceList = getWorkspaceChildrenRecursive(
            targetWorkspace,
            project
          );

          for (const workspace of workspaceList) {
            for (const dependencyType of Manifest.hardDependencies) {
              for (const descriptor of workspace.manifest
                .getForScope(dependencyType)
                .values()) {
                const matchingWorkspace = project.tryWorkspaceByDescriptor(
                  descriptor
                );

                if (matchingWorkspace === null) continue;

                await supervisor.addBuildTarget(matchingWorkspace);
              }
            }
            await supervisor.addBuildTarget(workspace);
          }

          await supervisor.addBuildTarget(targetWorkspace);
        } else {
          // we're in a specific target
          await supervisor.addBuildTarget(targetWorkspace);
        }

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

const getWorkspaceChildrenRecursive = (
  rootWorkspace: Workspace,
  project: Project
): Array<Workspace> => {
  const workspaceList = [];
  for (const childWorkspaceCwd of rootWorkspace.workspacesCwds) {
    const childWorkspace = project.workspacesByCwd.get(childWorkspaceCwd);
    if (childWorkspace) {
      workspaceList.push(
        childWorkspace,
        ...getWorkspaceChildrenRecursive(childWorkspace, project)
      );
    }
  }
  return workspaceList;
};
