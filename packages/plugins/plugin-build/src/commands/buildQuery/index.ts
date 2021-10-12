import { BaseCommand } from "@yarnpkg/cli";
import { formatUtils } from "@yarnpkg/core";
import { Configuration, Project } from "@yarnpkg/core";
import { Command, Usage } from "clipanion";
import {
  displayWorkspace,
  paddingTop,
  DisplayFormatType,
  welcome,
} from "./display";

export default class BuildQuery extends BaseCommand {
  static paths = [[`build`, "query"]];

  static usage: Usage = Command.Usage({
    category: `Build commands`,
    description: `prints out dependency graph for current package`,
    details: `
          In a monorepo with internal packages that depend on others, this command
          will traverse the dependency graph and efficiently ensure, the packages
          are built in the right order.
    
        `,
  });

  async execute(): Promise<0 | 1> {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );
    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    );

    if (!workspace) {
      // Workspace not found
      return 0;
    }
    const format: DisplayFormatType = (string: string, color: string) => {
      return formatUtils.pretty(configuration, string, color);
    };

    paddingTop({ padding: 1 });
    welcome({ workspace, format });
    displayWorkspace({ parents: [], workspace, project, format });
    paddingTop({ padding: 2 });

    return 0;
  }
}
