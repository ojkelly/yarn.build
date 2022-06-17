import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Cache,
  Configuration,
  Manifest,
  Project,
  StreamReport,
  Workspace,
} from "@yarnpkg/core";
import { getLibzipPromise } from "@yarnpkg/libzip";
import {
  Filename,
  NodeFS,
  PortablePath,
  npath,
  ppath,
  xfs,
  ZipFS,
} from "@yarnpkg/fslib";

import { Command, Option, Usage } from "clipanion";
import path from "path";
import { getAllWorkspacesNonRemovables, getExcludedFiles } from "./ignore";
import {
  DEFAULT_IGNORE_FILE,
  GetPartialPluginConfiguration,
} from "@ojkelly/yarn-build-shared/src/config";

enum MESSAGE_CODE {
  Info = "YB1000",
  RemoveUnusedPackages = "YB1001",
  RemoveEmptyDirectories = "YB1002",
  RemoveExcluded = "YB1003",
  AddedEntryPoint = "YB1004",
}

enum MESSAGE_GROUP {
  Start = " ┌ ",
  Progress = " │ ",
  End = " └ ",
}

// a compatible js file that reexports the file from pkg.main
export default class Bundler extends BaseCommand {
  static paths = [[`bundle`]];

  json = Option.Boolean(`--json`, false, {
    description: `flag is set the output will follow a JSON-stream output also known as NDJSON (https://github.com/ndjson/ndjson-spec)`,
  });

  quiet = Option.Boolean(`-q,--quiet`, false, {
    description: `suppress progess messages`,
  });

  temporaryDirectory = Option.String(`--temporary-directory`, {
    description:
      "superseeds --output-directory and --no-compress, when set the temporary directory used for bundling is written to a file you pass here ",
  });

  outputDirectory?: string = Option.String(`-o,--output-directory`, {
    description:
      "sets the output directory, this should be outside your source input directory.",
  });

  noCompress = Option.Boolean(`--no-compress`, false, {
    description: `set this with --output-directory to skip zipping your bundle, when this is set your output directory must be outside your project root`,
  });

  archiveName: Filename = Option.String(
    `-a,--archive-name`,
    `bundle.zip` as Filename,
    {
      description: `sets the name of the archive. Any files matching this, will be excluded from subsequent archives. Defaults to ./bundle.zip`,
    }
  );

  exclude = Option.Array(`--exclude`, [], {
    arity: 1,
    description: "Exclude specific paths from the final bundle.",
  });

  ignoreFile: Filename = Option.String("--ignore-file", DEFAULT_IGNORE_FILE, {
    description:
      "set the name of ignore file. Files matching this in workspace root and package root will be used to indicate which files will be excluded from bundle.",
  });

  static usage: Usage = Command.Usage({
    category: `Build commands`,
    description: `bundle a workspace package into a deployable archive`,
    details: `
      This command will bundle up the source of the target package along with
      its dependencies into an archive.

      This is designed to be used for deployment, not for publishing, so
      everything to run except for a runtime (ie node) is bundled into
      the archive.

      Call this after you have run your build step (if any).

      This is designed to work best with zero-install configurations. If you
      don't have that, run \`yarn install\` before this command.

      Why not just compile like we do on the front-end?
      Some dependencies may use require in interesting ways, or be or call
      binaries. It's safest not to transpile them.
    `,
  });

  progress(code: MESSAGE_CODE, group: MESSAGE_GROUP, msg: string): void {
    if (this.quiet !== true) {
      console.info(`➤ ${code}:${group}${msg}`);
    }
  }

  async removeUnusedPackages(
    tmpDir: PortablePath,
    tmpPackageCwd: PortablePath,
    configuration: Configuration
  ): Promise<void> {
    const { project, workspace } = await Project.find(
      configuration,
      tmpPackageCwd
    );

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, tmpPackageCwd);
    }

    const root = await Project.find(configuration, tmpDir);

    if (!root.workspace) {
      throw new WorkspaceRequiredError(root.project.cwd, tmpDir);
    }

    const requiredWorkspaces = new Set<Workspace>([workspace, root.workspace]);

    const pluginConfiguration = await GetPartialPluginConfiguration(
      configuration
    );

    this.exclude = pluginConfiguration.exclude
      ? [...this.exclude, ...pluginConfiguration.exclude]
      : this.exclude;

    this.ignoreFile =
      (pluginConfiguration?.ignoreFile as Filename) ?? this.ignoreFile;

    for (const workspace of requiredWorkspaces) {
      for (const dependencyType of Manifest.allDependencies) {
        for (const descriptor of workspace.manifest
          .getForScope(dependencyType)
          .values()) {
          // is this a local workspace, or a remote dependency?
          const matchingWorkspace =
            project.tryWorkspaceByDescriptor(descriptor);

          if (matchingWorkspace === null) continue;

          requiredWorkspaces.add(matchingWorkspace);
          this.progress(
            MESSAGE_CODE.RemoveUnusedPackages,
            MESSAGE_GROUP.Progress,
            `required:\t${matchingWorkspace.relativeCwd}`
          );
        }
      }
    }

    for (const workspace of project.workspaces) {
      if (requiredWorkspaces.has(workspace)) continue;
      if (workspace.cwd !== tmpDir) {
        // dont remove the root package
        await xfs.removePromise(workspace.cwd);
        this.progress(
          MESSAGE_CODE.RemoveUnusedPackages,
          MESSAGE_GROUP.Progress,
          `unused:\t${workspace.relativeCwd}`
        );
      }
    }
  }

  async removeEmptyDirectories({
    tmpDir,
    cwd,
  }: {
    tmpDir: PortablePath;
    cwd: PortablePath;
  }): Promise<boolean> {
    const isDir = xfs.statSync(cwd).isDirectory();

    if (!isDir) {
      return false;
    }
    let files = await xfs.readdirPromise(cwd);

    for (const file of files) {
      await this.removeEmptyDirectories({
        tmpDir,
        cwd: ppath.join(cwd, file),
      });
    }

    files = await xfs.readdirPromise(cwd);
    if (files.length === 0) {
      await xfs.removePromise(cwd);
      this.progress(
        MESSAGE_CODE.RemoveEmptyDirectories,
        MESSAGE_GROUP.Progress,
        `empty:\t${cwd.replace(tmpDir + "/", "")}`
      );

      return true;
    }

    return false;
  }

  async removeExcluded({
    tmpDir,
    excluded,
    nonRemovableFiles,
    yarnDirectory,
    cacheDirectory,
    shouldRemoveEmptyDirectories = false,
  }: {
    tmpDir: PortablePath;
    excluded: string[];
    nonRemovableFiles: string[];
    yarnDirectory: string;
    cacheDirectory: string;
    shouldRemoveEmptyDirectories?: boolean;
  }): Promise<void> {
    const gitDir = `${tmpDir}/.git` as PortablePath;

    try {
      if (await xfs.lstatPromise(gitDir)) {
        await xfs.removePromise(gitDir);
      }
    } catch (e) {}
    await Promise.all(
      excluded.map(async (p) => {
        p as PortablePath;
        if (p.startsWith(yarnDirectory)) {
          return;
        }
        if (p.startsWith(cacheDirectory)) {
          return;
        }
        if (nonRemovableFiles.includes(p)) {
          return;
        }
        if (!p.startsWith(tmpDir)) {
          // Don't remove anything not in the tmp directory
          return;
        }
        try {
          if (await xfs.lstatPromise(p as PortablePath)) {
            // File might already be deleted. For example if parent folder was deleted first.
            await xfs.removePromise(p as PortablePath);
          }
        } catch (_e) {
          // Empty on purpose
        }
      })
    );
    if (shouldRemoveEmptyDirectories) {
      await this.removeEmptyDirectories({ tmpDir, cwd: tmpDir });
    }
  }

  async execute(): Promise<0 | 1> {
    this.progress(
      MESSAGE_CODE.Info,
      MESSAGE_GROUP.Start,
      `Prepare ${this.context.cwd} for bundling`
    );

    this.progress(
      MESSAGE_CODE.Info,
      MESSAGE_GROUP.Progress,
      `Preparing temporary directory`
    );

    const bundle = async (tmpDir: PortablePath) => {
      // Save the originalCWD so we can store the archive somewhere
      const originalCwd = `${this.context.cwd}` as PortablePath;

      let outputArchive = ppath.join(originalCwd, this.archiveName);

      if (typeof this.outputDirectory == "string") {
        const resolvedOutputDir = resolveNativePath(this.outputDirectory);

        if (!xfs.existsSync(resolvedOutputDir)) {
          await xfs.mkdirPromise(resolvedOutputDir);
        }

        if (xfs.readdirSync(resolvedOutputDir).length != 0) {
          console.error("ERROR: --output-directory is not empty");

          return 1;
        }

        outputArchive = ppath.join(resolvedOutputDir, this.archiveName);
      }
      // Get the configuration where our source code is
      const sourceConfiguration = await Configuration.find(
        this.context.cwd,
        this.context.plugins
      );

      if (sourceConfiguration.projectCwd === null) {
        throw new Error("Can't find project directory");
      }

      // find the relative dir of the package thats selected
      const packageCwd = originalCwd.replace(
        sourceConfiguration.projectCwd,
        ""
      );

      let noCompressIsSafe = false;
      let outputPath: PortablePath | undefined;

      if (this.noCompress === true) {
        if (typeof this.outputDirectory !== "string") {
          console.error(
            "ERROR: you set --no-compress, but did not specify --output-directory"
          );

          return 1;
        } else {
          outputPath = resolveNativePath(this.outputDirectory);

          if (outputPath.startsWith(sourceConfiguration.projectCwd)) {
            console.error(
              "ERROR: --output-directory is inside project root with --no-compress set.\nThis is no allowed to prevent you destroying your project"
            );

            return 1;
          }
        }

        noCompressIsSafe = true;
      }

      // copy everything to the tmpDir
      const baseFs = new NodeFS();

      this.progress(
        MESSAGE_CODE.Info,
        MESSAGE_GROUP.Progress,
        `Copying repo to temporary directory`
      );
      await xfs.copyPromise(tmpDir, sourceConfiguration.projectCwd, {
        baseFs,
      });

      const tmpPackageCwd = `${tmpDir}${packageCwd}` as PortablePath;

      const previousArchive =
        `${tmpPackageCwd}/${this.archiveName}` as PortablePath;

      let exclude = this.exclude;

      try {
        if (await xfs.lstatPromise(previousArchive)) {
          exclude.push(previousArchive);
        }
      } catch (e) {}

      const configuration = await Configuration.find(
        tmpPackageCwd,
        this.context.plugins
      );

      configuration.use("<custom>", { enableNetwork: false }, tmpPackageCwd);

      const cache = await Cache.find(configuration);
      const yarnDirectory = `${tmpDir}/.yarn`;
      const cacheDirectory = cache.cwd;

      this.progress(
        MESSAGE_CODE.Info,
        MESSAGE_GROUP.Progress,
        `Removing unused and excluded workspaces, folders and files`
      );

      await this.removeUnusedPackages(tmpDir, tmpPackageCwd, configuration);

      const { project, workspace } = await Project.find(
        configuration,
        tmpPackageCwd
      );

      if (!workspace) {
        throw new WorkspaceRequiredError(project.cwd, tmpPackageCwd);
      }

      const root = await Project.find(configuration, tmpDir);

      if (!root.workspace) {
        throw new WorkspaceRequiredError(root.project.cwd, tmpDir);
      }

      const requiredWorkspaces = new Set<Workspace>([
        workspace,
        root.workspace,
      ]);

      const nonRemovableFiles = getAllWorkspacesNonRemovables({
        workspaces: requiredWorkspaces,
        rootDir: tmpDir,
      });

      exclude = await getExcludedFiles({
        cwd: tmpDir,
        ignoreFile: this.ignoreFile,
        exclude,
      });

      for (const workspace of requiredWorkspaces) {
        for (const dependencyType of Manifest.allDependencies) {
          for (const descriptor of workspace.manifest
            .getForScope(dependencyType)
            .values()) {
            // is this a local workspace, or a remote dependency?
            const matchingWorkspace =
              project.tryWorkspaceByDescriptor(descriptor);

            if (matchingWorkspace === null) continue;
            requiredWorkspaces.add(matchingWorkspace);
          }
        }
      }

      // Remove from every unused workspace
      for (const workspace of requiredWorkspaces) {
        const workspaceExclude = await getExcludedFiles({
          cwd: workspace.cwd,
          ignoreFile: this.ignoreFile,
          exclude,
        });

        // Remove stuff we dont need from packages
        await this.removeExcluded({
          tmpDir,
          excluded: workspaceExclude,
          nonRemovableFiles,
          yarnDirectory,
          cacheDirectory,
          shouldRemoveEmptyDirectories: false,
        });
      }

      // Remove stuff we dont need globally
      await this.removeExcluded({
        tmpDir,
        excluded: exclude,
        nonRemovableFiles,
        yarnDirectory,
        cacheDirectory,
        shouldRemoveEmptyDirectories: true,
      });

      for (const workspace of project.workspaces) {
        workspace.manifest.devDependencies.clear();
        if (requiredWorkspaces.has(workspace)) continue;
        workspace.manifest.dependencies.clear();
        workspace.manifest.peerDependencies.clear();
      }

      if (workspace?.manifest?.raw?.main) {
        // Add entrypoint
        // TODO: make mainFile configurable
        const mainFile =
          workspace.relativeCwd +
          path.posix.sep +
          workspace?.manifest?.raw?.main;

        // TODO: check if it's .pnp.js or .pnp.cjs
        // https://github.com/yarnpkg/berry/pull/2286
        const pnp = `.pnp.cjs`;

        xfs.writeFilePromise(
          `${tmpDir}${path.posix.sep}entrypoint.js` as PortablePath,
          generateEntrypointFile(mainFile, pnp)
        );
      }

      this.progress(MESSAGE_CODE.Info, MESSAGE_GROUP.End, `Completed`);
      const report = await StreamReport.start(
        {
          configuration,
          json: this.json,
          stdout: this.context.stdout,
          includeLogs: true,
        },
        async (report: StreamReport) => {
          // Install and remove everything we dont need
          await project.install({
            cache,
            report,
          });

          if (typeof this.temporaryDirectory !== `undefined`) {
            return;
          }

          // If flags set don't zip and copy to a tmp directory
          if (noCompressIsSafe && typeof outputPath !== `undefined`) {
            report.reportInfo(null, "Moving build to output directory");

            await baseFs.copyPromise(outputPath, tmpDir);
          } else {
            const libzip = await getLibzipPromise();

            report.reportInfo(null, "Creating archive");

            const zipFs = new ZipFS(outputArchive, {
              create: true,
              libzip,
            });

            report.reportInfo(null, "Copying files to archive");

            // copy into the root of the zip file
            await zipFs.copyPromise("/" as PortablePath, tmpDir, {
              baseFs,
            });

            zipFs.saveAndClose();

            report.reportJson({
              name: "ArchiveSuccess",
              message: "Archive created successfuly at ",
              outputArchive,
            });
          }
        }
      );

      return report.exitCode();
    };

    if (typeof this.temporaryDirectory !== `undefined`) {
      return await bundle(this.temporaryDirectory as PortablePath);
    } else {
      // Get a tmpDir to work in
      return await xfs.mktempPromise(bundle);
    }
  }
}

// Generates an entrypoint file that's placed at the root of the repository,
// and can be called to run the bundled package.
const generateEntrypointFile = (main: string, pnp: string): string => `
"use strict";

const path = require("path");

const pnp = require(path.normalize(path.resolve( __dirname, "${pnp}"))).setup();

module.exports = require(path.normalize(path.resolve( __dirname,"${main}")));

Object.defineProperty(exports, "__esModule", { value: true });
`;

/**
 * Resolves a user-given path from native path format to a portable path
 * format.
 * @internal
 */
export function resolveNativePath(path: string): PortablePath {
  const portablePath = npath.toPortablePath(path);

  return ppath.resolve(portablePath);
}
