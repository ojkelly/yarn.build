import { Project, Workspace } from "@yarnpkg/core";
import { getName } from "./getName";

interface GetInternalDependenciesProps {
  workspace: Workspace;
  project: Project;
}
export const getInternalDependencies = ({
  workspace,
  project,
}: GetInternalDependenciesProps): string[] => {
  const dependencies = Array.from(workspace.manifest.dependencies.values()).map(
    (value) => getName(value)
  );
  const internalDependencies = Array.from(project.workspaces.values()).map(
    (value) => getName(value.manifest.name)
  );

  return dependencies.filter((value) => internalDependencies.includes(value));
};
