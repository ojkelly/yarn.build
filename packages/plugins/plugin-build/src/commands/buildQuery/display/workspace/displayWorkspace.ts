import { Project, Workspace } from "@yarnpkg/core";
import { Maybe } from "src/types";
import { DisplayFormatType } from "..";
import { displayDependencies } from "./dependencies";
import { displayName } from "./displayName";

interface DisplayWorkspaceProps {
  workspace: Workspace;
  project: Project;
  padding?: number;
  parent?: Maybe<string>;
  format: DisplayFormatType;
}

export const displayWorkspace = ({
  format,
  workspace,
  project,
  padding = 0,
  parent,
}: DisplayWorkspaceProps): void => {
  displayName({ workspace, padding, format });
  displayDependencies({ workspace, project, padding, parent, format });
};
