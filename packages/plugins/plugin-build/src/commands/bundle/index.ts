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
  xfs,
  NodeFS,
  PortablePath,
  ZipFS,
  ppath,
  Filename,
} from "@yarnpkg/fslib";

import { Command, Option, Usage } from "clipanion";
import path from "path";
import { DEFAULT_IGNORE_FILE } from "../../modules/ignore";
import { GetPartialPluginConfiguration  } from "../../config";
import { getExcludedFiles } from "../../modules/ignore";

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

  ignoreFile: Filename = Option.String(
    '--ignore-file',
    DEFAULT_IGNORE_FILE,
    {
      description: 'set the name of ignore file. Files matching this in workspace root and package root will be used to indicate which files will be excluded from bundle.'
    }
  )

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
    const pluginConfiguration = await GetPartialPluginConfiguration(configuration);

    this.ignoreFile = pluginConfiguration?.ignoreFile as Filename ?? this.ignoreFile;

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

  async removeExcluded(
    tmpDir: PortablePath,
    excluded: string[],
    outputArchive: string,
  ): Promise<void> {
    const gitDir = `${tmpDir}/.git` as PortablePath;
    
    try {
      if (await xfs.lstatPromise(gitDir)) {
        await xfs.removePromise(gitDir);
      }
    } catch (e) {}

    await Promise.all(excluded.map(async (p) => {
      p as PortablePath;
      if (p === outputArchive) {
        // Don't delete zip file
        return;
      }
      if (!p.startsWith(tmpDir)) {
        // Don't remove anything not in the tmp directory
        return;
      }

      if (await xfs.lstatPromise(p as PortablePath)) {
        // File might already be deleted. For example if parent folder was deleted first.
        try {
          await xfs.removePromise(p as PortablePath);
        } catch(_e) {
          // Empty on purpose
        }
      }
    }));
  }

  async execute(): Promise<0 | 1> {
    // Get a tmpDir to work in
    return await xfs.mktempPromise(async (tmpDir) => {
      // Save the originalCWD so we can store the archive somewhere
      const originalCwd = `${this.context.cwd}` as PortablePath;

      let outputArchive = ppath.join(originalCwd, this.archiveName);

      if (typeof this.outputDirectory == "string") {
        const resovledOutputDir = ppath.resolve(
          this.outputDirectory as PortablePath
        );

        if (!fs.existsSync(resovledOutputDir)) {
          // console.error("ERROR: --output-directory does not exist");

          // return 1;

          await xfs.mkdirPromise(resovledOutputDir);
        }

        if (fs.readdirSync(resovledOutputDir).length != 0) {
          console.error("ERROR: --output-directory is not empty");

          return 1;
        }

        outputArchive = ppath.join(
          resovledOutputDir as PortablePath,
          this.archiveName
        );
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
          outputPath = ppath.resolve(
            this.outputDirectory as PortablePath
          ) as PortablePath;

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

      exclude = await getExcludedFiles({
        cwd: tmpDir,
        ignoreFile: this.ignoreFile,
        exclude,
      });

      // Remove stuff we dont need
     await this.removeExcluded(tmpDir, exclude, outputArchive);
      const configuration = await Configuration.find(
        tmpPackageCwd,
        this.context.plugins
      );

      const cache = await (async () => {
        // This can fail if we remove to aggresivly
        // should we add more checks so the user 
        // cannot delete wrong files or should we
        // allow him to do whatever and just break?
        //
        // I choose the latter. 
        try {
          const cache = await Cache.find(configuration);

          return cache;
        } catch(e) {
          throw new Error("Failed fetching cache. Check out your config.");
        }
      })();

      await this.removeUnusedPackages(tmpDir, tmpPackageCwd, configuration);

      const { project, workspace } = await Project.find(
        configuration,
        tmpPackageCwd
      );

      if (!workspace)
        throw new WorkspaceRequiredError(project.cwd, tmpPackageCwd);

      const requiredWorkspaces = new Set<Workspace>([workspace]);

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

        await this.removeExcluded(tmpDir, workspaceExclude, outputArchive);
      }
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
