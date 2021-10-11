import { Project, Workspace } from "@yarnpkg/core";
import { getInternalDependencies, getName } from "../../../utils";
import { Maybe } from "../../../../../types";
import { displayDependency } from "./displayDependency";
import { DisplayFormatType } from "../..";

interface DisplayDependenciesProps {
  workspace: Workspace;
  project: Project;
  padding?: number;
  parents: string[];
  parent?: Maybe<string>;
  format: DisplayFormatType;
}
export const displayDependencies = ({
  format,
  workspace,
  parent,
  parents,
  project,
  padding = 0,
}: DisplayDependenciesProps): void => {
  const dependencies = getInternalDependencies({ workspace, project });

  for (const dependency of dependencies) {
    displayDependency({
      format,
      workspace,
      project,
      padding,
      parent,
      parents,
      current: getName(workspace.manifest.name),
      circular: parent === dependency || parents.includes(dependency),
      dependency,
    });
  }
};
