import { Command, Option, Usage } from "clipanion";

import Build from "@ojkelly/yarn-plugin-build/src/commands/build";

export default class Test extends Build {
  static paths = [[`test`]];

  static usage: Usage = Command.Usage({
    category: `Test commands`,
    description: `test a package and all its dependencies`,
    details: `
      In a monorepo with internal packages that depend on others, this command
      will traverse the dependency graph and efficiently ensure, the packages
      are tested in the right order.
      `,
  });

  buildCommand = Option.String(`-c,--command`, `test`, {
    description: `the command to be run in each package (if available), defaults to "test"`,
  });

  onlyCurrent = Option.Boolean("--only-current", true, {
    description: `only test the current workspace`,
  });
}
