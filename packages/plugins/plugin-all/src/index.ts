import { Plugin } from "@yarnpkg/core";

import build from "@yarn.build/yarn-plugin-build/src/commands/build";
import buildQuery from "@yarn.build/yarn-plugin-build/src/commands/buildQuery";
import test from "@yarn.build/yarn-plugin-test/src/commands/test";

const plugin: Plugin = {
  commands: [buildQuery, build, test],
};

export default plugin;
