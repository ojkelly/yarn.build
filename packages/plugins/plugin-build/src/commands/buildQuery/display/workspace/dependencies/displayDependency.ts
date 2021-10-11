import { FormatType, Project, Workspace } from "@yarnpkg/core";
import { getWorkspaceByName } from "../../../utils";
import { Maybe } from "src/types";
import { displayWorkspace } from "../displayWorkspace";
import { paddingLeft } from "../../paddingLeft";
import { DisplayFormatType } from "../..";

interface DisplayDependencyProps {
  dependency: string;
  workspace: Workspace;
  project: Project;
  padding?: number;
  current: string;
  parent?: Maybe<string>;
  circular: boolean;
  format: DisplayFormatType;
}

const COLOR = FormatType.NAME;
const ERROR_COLOR = "red";

export const displayDependency = ({
  format,
  circular,
  dependency,
  current,
  project,
  padding = 0,
}: DisplayDependencyProps): void => {
  if (circular) {
    paddingLeft({ format, padding: padding + 1 });
    process.stdout.write(format(dependency, COLOR));
    process.stdout.write(format(" -> circular dependency", ERROR_COLOR));

    process.stdout.write("\n");

    return;
  }
  const workspace = getWorkspaceByName({ project, workspaceName: dependency });

  if (!workspace) {
    paddingLeft({ format, padding: padding + 1 });
    process.stdout.write(dependency);
    process.stdout.write(format("-> incorrect dependency", ERROR_COLOR));

    process.stdout.write("\n");

    return;
  }

  displayWorkspace({
    format,
    project,
    parent: current,
    padding: padding + 1,
    workspace,
  });
};
