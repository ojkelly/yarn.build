import { Filename, PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { Configuration } from "@yarnpkg/core";
import * as t from "typanion";
import { load, JSON_SCHEMA } from "js-yaml";

const DEFAULT_YARN_BUILD_CONFIGRATION_FILENAME = `.yarnbuildrc.yml` as Filename;

const isYarnBuildConfiguration = t.isObject({
  folders: t.isObject({
    bail: t.isBoolean(),
    input: t.isString(),
    output: t.isString(),
  }),
  maxConcurrency: t.isOptional(
    t.applyCascade(t.isNumber(), [t.isInteger(), t.isInInclusiveRange(1, 128)])
  ),
});

type YarnBuildConfiguration = t.InferType<typeof isYarnBuildConfiguration>;

async function getConfiguration(
  configuration: Configuration,
): Promise<YarnBuildConfiguration> {
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
  return {
    folders: {
      bail: false,
      input: ".",
      output: "build",
    },
    maxConcurrency: 8,
  };
}

async function GetPluginConfiguration(
  configuration: Configuration,
): Promise<YarnBuildConfiguration> {
  return await getConfiguration(configuration);
}

export { YarnBuildConfiguration, GetPluginConfiguration };
