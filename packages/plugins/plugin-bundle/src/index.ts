import { Plugin } from "@yarnpkg/core";

import bundle from "./commands/bundle";

const plugin: Plugin = {
  commands: [bundle],
};

export default plugin;
