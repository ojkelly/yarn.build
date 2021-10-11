import { Project, Workspace } from "@yarnpkg/core";
import { Maybe } from "../../../types";
import { getName } from "./getName";

export interface GetWorkspaceProps {
    project: Project;
    workspaceName: string;
}

export const getWorkspaceByName = ({project, workspaceName}: GetWorkspaceProps): Maybe<Workspace> => {
    const workspace = project.workspaces.find((value) => {
        const name = getName(value.manifest.name);

        return name === workspaceName;
    });
    
    return workspace;
};