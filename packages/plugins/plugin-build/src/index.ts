import { Plugin } from "@yarnpkg/core";

import build from "./commands/build";
import buildQuery from "./commands/buildQuery";

const plugin: Plugin = {
  commands: [build, buildQuery],
};

export default plugin;
