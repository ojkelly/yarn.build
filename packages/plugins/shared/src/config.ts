import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { Configuration } from "@yarnpkg/core";
import * as t from "typanion";
import { load, JSON_SCHEMA } from "js-yaml";
import { DeepPartial } from "./types";

const DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME = `.yarnbuildrc.yml` as Filename;

const DEFAULT_IGNORE_FILE = ".bundleignore" as Filename;

const isYarnBuildConfiguration = t.isObject({
  folders: t.isObject({
    input: t.isOneOf([t.isString(), t.isArray(t.isString())]),
    output: t.isOneOf([t.isString(), t.isArray(t.isString())]),
  }),
  exclude: t.isArray(t.isString()),
  bail: t.isBoolean(),
  hideYarnBuildBadge: t.isBoolean(),
  ignoreFile: t.isString(),
});

const isYarnBuildManifestConfiguration = t.isObject({
  input: t.isOptional(t.isOneOf([t.isString(), t.isArray(t.isString())])),
  output: t.isOptional(t.isOneOf([t.isString(), t.isArray(t.isString())])),
  tsconfig: t.isOptional(t.isString()),
});

type YarnBuildConfiguration = t.InferType<typeof isYarnBuildConfiguration>;

type YarnBuildManifestConfiguration = t.InferType<
  typeof isYarnBuildManifestConfiguration
>;

const DEFAULT_CONFIG: YarnBuildConfiguration = {
  folders: {
    input: ".",
    output: "build",
  },
  exclude: [],
  bail: true,
  hideYarnBuildBadge: false,
  ignoreFile: DEFAULT_IGNORE_FILE,
};

async function getConfiguration(
  configuration: Configuration
): Promise<DeepPartial<YarnBuildConfiguration>> {
  // TODO: make this more customisable
  const rcFilename = DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME;

  const rcPath = ppath.join(
    configuration.projectCwd || configuration.startingCwd,
    rcFilename as PortablePath
  );

  if (xfs.existsSync(rcPath)) {
    const content = await xfs.readFilePromise(rcPath, `utf8`);

    const errors: string[] = [];

    try {
      const configOnDisk = load(content, { schema: JSON_SCHEMA });

      if (isYarnBuildConfiguration(configOnDisk, { errors })) {
        return configOnDisk;
      }

      console.warn(errors);
    } catch (error) {
      let tip = ``;

      if (content.match(/^\s+(?!-)[^:]+\s+\S+/m))
        tip = ` (config is corrupted, please check it matches the shape in the yarn.build readme.`;

      throw new Error(
        `Parse error when loading ${rcPath}; please check it's proper Yaml${tip}`
      );
    }
  }

  // return default config if none found
  return DEFAULT_CONFIG;
}

async function GetPartialPluginConfiguration(
  configuration: Configuration
): Promise<DeepPartial<YarnBuildConfiguration>> {
  return await getConfiguration(configuration);
}

async function GetPluginConfiguration(
  configuration: Configuration
): Promise<YarnBuildConfiguration> {
  const data = await getConfiguration(configuration);

  return {
    ...DEFAULT_CONFIG,
    ...data,
    folders: {
      ...DEFAULT_CONFIG.folders,
      ...(data.folders ?? {}),
    },
  };
}

function getWorkspaceConfiguration(packageJsonManifest: {
  [key: string]: any;
}): YarnBuildManifestConfiguration {
  const configuration = {
    ...packageJsonManifest["yarn.build"],
  };

  if (isYarnBuildManifestConfiguration(configuration)) {
    return configuration;
  }

  return {};
}

export {
  isYarnBuildConfiguration,
  YarnBuildConfiguration,
  GetPluginConfiguration,
  GetPartialPluginConfiguration,
  DEFAULT_IGNORE_FILE,
  DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME,
  isYarnBuildManifestConfiguration,
  YarnBuildManifestConfiguration,
  getWorkspaceConfiguration,
};
