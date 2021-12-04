import { Plugin } from "@yarnpkg/core";

import test from "./commands/test";

const plugin: Plugin = {
  commands: [test],
};

export default plugin;
