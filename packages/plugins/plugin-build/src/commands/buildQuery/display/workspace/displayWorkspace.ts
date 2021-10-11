import { Project, Workspace } from "@yarnpkg/core";
import { Maybe } from "../../../../types";
import { DisplayFormatType } from "..";
import { displayDependencies } from "./dependencies";
import { displayName } from "./displayName";

interface DisplayWorkspaceProps {
  workspace: Workspace;
  project: Project;
  padding?: number;
  parent?: Maybe<string>;
  parents: string[];
  format: DisplayFormatType;
}

export const displayWorkspace = ({
  format,
  workspace,
  project,
  parents,
  padding = 0,
  parent,
}: DisplayWorkspaceProps): void => {
  displayName({ workspace, padding, format });
  displayDependencies({ parents, workspace, project, padding, parent, format });
};
