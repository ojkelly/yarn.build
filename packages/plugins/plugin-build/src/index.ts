import { Plugin } from "@yarnpkg/core";

import bundle from "./commands/bundle";
import build from "./commands/build";
import buildQuery from "./commands/buildQuery";
import test from "./commands/test";

const plugin: Plugin = {
  commands: [bundle, buildQuery, build, test],
};

export default plugin;
