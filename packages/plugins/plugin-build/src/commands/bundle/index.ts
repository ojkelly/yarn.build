import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import fs from "fs";
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
import {
  DEFAULT_IGNORE_FILE,
  getAllWorkspacesNonRemovables,
  getExcludedFiles,
} from "./ignore";
import { GetPartialPluginConfiguration } from "../../config";

// a compatible js file that reexports the file from pkg.main
export default class Bundler extends BaseCommand {
  static paths = [[`bundle`]];

  json = Option.Boolean(`--json`, false, {
    description: `flag is set the output will follow a JSON-stream output also known as NDJSON (https://github.com/ndjson/ndjson-spec)`,
  });

  outputDirectory?: string = Option.String(`-o,--output-directory`, {
    description:
      "sets the output directory, this should be outside your source input directory.",
  });

  noCompress = Option.Boolean(`--no-compress`, false, {
    description: `set this with --output-directory to skip zipping your bundle, when this is set your output directory must be outside your projecty root`,
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

  async removeUnusedPackages(
    tmpDir: PortablePath,
    tmpPackageCwd: PortablePath,
    configuration: Configuration
  ): Promise<void> {
    const { project, workspace } = await Project.find(
      configuration,
      tmpPackageCwd
    );

    if (!workspace)
      throw new WorkspaceRequiredError(project.cwd, tmpPackageCwd);

    const requiredWorkspaces = new Set<Workspace>([workspace]);
    const pluginConfiguration = await GetPartialPluginConfiguration(
      configuration
    );

    this.exclude = pluginConfiguration.exclude
      ? [...this.exclude, ...pluginConfiguration.exclude]
      : this.exclude;

    this.ignoreFile =
      (pluginConfiguration?.ignoreFile as Filename) ?? this.ignoreFile;

    for (const workspace of requiredWorkspaces) {
      for (const dependencyType of Manifest.hardDependencies) {
        for (const descriptor of workspace.manifest
          .getForScope(dependencyType)
          .values()) {
          const matchingWorkspace =
            project.tryWorkspaceByDescriptor(descriptor);

          if (matchingWorkspace === null) continue;

          requiredWorkspaces.add(matchingWorkspace);
        }
      }
    }

    for (const workspace of project.workspaces) {
      if (requiredWorkspaces.has(workspace)) continue;
      if (workspace.cwd !== tmpDir) {
        // dont remove the root package
        await xfs.removePromise(workspace.cwd);
      }
    }
  }

  async removeEmptyDirectories({
    cwd,
  }: {
    cwd: PortablePath;
  }): Promise<boolean> {
    const isDir = xfs.statSync(cwd).isDirectory();

    if (!isDir) {
      return false;
    }
    let files = await xfs.readdirPromise(cwd);

    for (const file of files) {
      await this.removeEmptyDirectories({
        cwd: ppath.join(cwd, file),
      });
    }
    files = await xfs.readdirPromise(cwd);
    if (files.length === 0) {
      await xfs.removePromise(cwd);

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
      await this.removeEmptyDirectories({ cwd: tmpDir });
    }
  }

  async execute(): Promise<0 | 1> {
    // Get a tmpDir to work in
    return await xfs.mktempPromise(async (tmpDir) => {
      // Save the originalCWD so we can store the archive somewhere
      const originalCwd = `${this.context.cwd}` as PortablePath;

      let outputArchive = ppath.join(originalCwd, this.archiveName);

      if (typeof this.outputDirectory == "string") {
        const resolvedOutputDir = resolveNativePath(this.outputDirectory);

        if (!fs.existsSync(resolvedOutputDir)) {
          // console.error("ERROR: --output-directory does not exist");

          // return 1;

          await xfs.mkdirPromise(resolvedOutputDir);
        }

        if (fs.readdirSync(resolvedOutputDir).length != 0) {
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

      const cache = await Cache.find(configuration);
      const yarnDirectory = `${tmpDir}/.yarn`;
      const cacheDirectory = cache.cwd;

      await this.removeUnusedPackages(tmpDir, tmpPackageCwd, configuration);

      const { project, workspace } = await Project.find(
        configuration,
        tmpPackageCwd
      );

      if (!workspace)
        throw new WorkspaceRequiredError(project.cwd, tmpPackageCwd);

      const requiredWorkspaces = new Set<Workspace>([workspace]);
      const nonRemovableFiles = getAllWorkspacesNonRemovables({
        workspaces: project.workspaces,
        rootDir: tmpDir,
      });

      exclude = await getExcludedFiles({
        cwd: tmpDir,
        ignoreFile: this.ignoreFile,
        exclude,
      });

      for (const workspace of requiredWorkspaces) {
        for (const dependencyType of Manifest.hardDependencies) {
          for (const descriptor of workspace.manifest
            .getForScope(dependencyType)
            .values()) {
            const matchingWorkspace =
              project.tryWorkspaceByDescriptor(descriptor);

            if (matchingWorkspace === null) continue;

            requiredWorkspaces.add(matchingWorkspace);
          }
        }
      }
      // Remove from every workspace
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
          workspace.relativeCwd + path.sep + workspace?.manifest?.raw?.main;

        // TODO: check if it's .pnp.js or .pnp.cjs
        // https://github.com/yarnpkg/berry/pull/2286
        const pnp = `./.pnp.cjs`;

        xfs.writeFilePromise(
          `${tmpDir}${path.sep}entrypoint.js` as PortablePath,
          generateEntrypointFile(mainFile, pnp)
        );
      }

      const report = await StreamReport.start(
        {
          configuration,
          json: this.json,
          stdout: this.context.stdout,
          includeLogs: true,
        },
        async (report: StreamReport) => {
          // Install and remove everything we dont need
          await project.install({ cache, report });

          // If flags set don't zip and copy to a tmp directory
          if (noCompressIsSafe && typeof outputPath !== `undefined`) {
            report.reportInfo(null, "Moving build to output directory");

            await baseFs.movePromise(tmpDir, outputPath);
          } else {
            const libzip = await getLibzipPromise();

            report.reportInfo(null, "Creating archive");

            const zipFs = new ZipFS(outputArchive, {
              create: true,
              libzip,
            });

            const prefixPath = "bundle" as PortablePath;

            report.reportInfo(null, "Copying files to archive");

            await zipFs.copyPromise(prefixPath, tmpDir, {
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
    });
  }
}

// Generates an entrypoint file that's placed at the root of the repository,
// and can be called to run the bundled package.
const generateEntrypointFile = (main: string, pnp: string): string => `
"use strict";

const pnp = require("${pnp}").setup();

const index = require("./${main}");

Object.defineProperty(exports, "__esModule", { value: true });

exports.default = index;
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
