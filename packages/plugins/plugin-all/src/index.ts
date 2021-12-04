import { Plugin } from "@yarnpkg/core";

import bundle from "@ojkelly/yarn-plugin-bundle/src/commands/bundle";
import build from "@ojkelly/yarn-plugin-build/src/commands/build";
import buildQuery from "@ojkelly/yarn-plugin-build/src/commands/buildQuery";
import test from "@ojkelly/yarn-plugin-test/src/commands/test";

const plugin: Plugin = {
  commands: [bundle, buildQuery, build, test],
};

export default plugin;
