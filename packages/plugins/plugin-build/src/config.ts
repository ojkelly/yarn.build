import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { parseSyml } from "@yarnpkg/parsers";
import { Configuration } from "@yarnpkg/core";
import * as yup from "yup";

const DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME = `.yarnbuildrc.yml` as Filename;

/** The validation pattern used to validate any max concurrency option */
export const maxConcurrencyValidation = yup.number().integer().moreThan(0);

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
    // Feature to allow yarn build packages/*
    // yarn build package/example/lorem-ipsum
    targetedBuilds: boolean;
  };
  maxConcurrency?: number | undefined;
};

async function getConfiguration(
  configuration: Configuration
): Promise<YarnBuildConfiguration> {
  let configOnDisk: unknown = {};

  // TODO: make this more customisable
  const rcFilename = DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME;

  const rcPath = ppath.join(
    configuration.projectCwd || configuration.startingCwd,
    rcFilename as PortablePath
  );

  if (xfs.existsSync(rcPath)) {
    const content = await xfs.readFilePromise(rcPath, `utf8`);

    try {
      configOnDisk = parseSyml(content);
    } catch (error) {
      let tip = ``;

      if (content.match(/^\s+(?!-)[^:]+\s+\S+/m))
        tip = ` (in particular, make sure you list the colons after each key name)`;

      throw new Error(
        `Parse error when loading ${rcPath}; please check it's proper Yaml${tip}`
      );
    }
  }

  const configSchema = yup.object().shape({
    commands: yup.object().shape({
      build: yup.string().default("build"),
      test: yup.string().default("test"),
      dev: yup.string().default("dev"),
    }),
    folders: yup.object().shape({
      input: yup.string().default("."),
      output: yup.string().default("build"),
    }),
    enableBetaFeatures: yup.object().shape({
      folderConfiguration: yup.boolean().default(true),
      targetedBuilds: yup.boolean().default(false),
    }),
    maxConcurrency: maxConcurrencyValidation,
  });

  return configSchema.validate(configOnDisk);
}

async function GetPluginConfiguration(
  configuration: Configuration
): Promise<YarnBuildConfiguration> {
  return await getConfiguration(configuration);
}

export { YarnBuildConfiguration, GetPluginConfiguration };
