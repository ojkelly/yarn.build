import { Plugin } from "@yarnpkg/core";

import bundle from "./commands/bundle";
import build from "./commands/build";
import test from "./commands/test";

const plugin: Plugin = {
  commands: [bundle, build, test],
};

export default plugin;
