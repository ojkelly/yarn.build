import { Plugin } from "@yarnpkg/core";

import bundle from "./commands/bundle";
import build from "./commands/build";

const plugin: Plugin = {
  commands: [bundle, build],
};

export default plugin;
