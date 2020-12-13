import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { parseSyml } from "@yarnpkg/parsers";
import { Configuration } from "@yarnpkg/core";

const DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME = `.yarnbuildrc.yml` as Filename;

type YarnBuildConfiguration = {
  // Customising the commands are runtime is not currently supported in Yarn
  // So this part is a WIP
  commands: {
    build: string;
    test: string;
    dev: string;
  };
  folders: {
    input: string;
    output: string;
  };
  enableBetaFeatures: {
    // Feature to allow configuring input/output folders
    folderConfiguration: boolean;
  };
};

async function getConfiguration(
  configuration: Configuration
): Promise<YarnBuildConfiguration> {
  let configOnDisk: {
    commands?: {
      build?: string;
      test?: string;
      dev?: string;
    };
    folders?: {
      input?: string;
      output?: string;
    };
    enableBetaFeatures?: {
      folderConfiguration?: boolean;
    };
  } = {};

  // TODO: make this more customisable
  const rcFilename = DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME;

  const rcPath = ppath.join(
    configuration.projectCwd || configuration.startingCwd,
    rcFilename as PortablePath
  );

  if (xfs.existsSync(rcPath)) {
    const content = await xfs.readFilePromise(rcPath, `utf8`);

    try {
      configOnDisk = parseSyml(content) as YarnBuildConfiguration;
    } catch (error) {
      let tip = ``;

      if (content.match(/^\s+(?!-)[^:]+\s+\S+/m))
        tip = ` (in particular, make sure you list the colons after each key name)`;

      throw new Error(
        `Parse error when loading ${rcPath}; please check it's proper Yaml${tip}`
      );
    }
  }

  // I thought about more complex ways to load and check the config.
  // For now, we don't need to overdo it. Later on that might make sense
  // but not now.
  return {
    commands: {
      build:
        typeof configOnDisk?.commands?.build === "string"
          ? configOnDisk.commands.build
          : "build",
      test:
        typeof configOnDisk?.commands?.test === "string"
          ? configOnDisk.commands.test
          : "test",
      dev:
        typeof configOnDisk?.commands?.dev === "string"
          ? configOnDisk.commands.dev
          : "dev",
    },
    folders: {
      input:
        typeof configOnDisk?.folders?.input === "string"
          ? configOnDisk.folders.input
          : "src",
      output:
        typeof configOnDisk?.folders?.output === "string"
          ? configOnDisk.folders.output
          : "build",
    },
    enableBetaFeatures: {
      folderConfiguration:
        typeof configOnDisk?.enableBetaFeatures?.folderConfiguration ===
          "string" &&
        configOnDisk?.enableBetaFeatures?.folderConfiguration === "true"
          ? true
          : false,
    },
  };
}

async function GetPluginConfiguration(): Promise<YarnBuildConfiguration> {
  const configuration = await Configuration.find(ppath.cwd(), null);
  return await getConfiguration(configuration);
}

export { YarnBuildConfiguration, GetPluginConfiguration };
