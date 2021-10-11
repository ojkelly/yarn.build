import { Project, Workspace } from "@yarnpkg/core";
import { getInternalDependencies } from "../../../utils";
import { Maybe } from "src/types";
import { displayDependency } from "./displayDependency";
import { DisplayFormatType } from "../..";

interface DisplayDependenciesProps {
    workspace: Workspace;
    project: Project;
    padding?: number;
    parent?: Maybe<string>;
    format: DisplayFormatType;
}
export const displayDependencies = ({format, workspace, parent, project, padding = 0}: DisplayDependenciesProps): void => {
    const dependencies = getInternalDependencies({workspace, project});

    for (const dependency of dependencies) {
        displayDependency({format, workspace, project, padding, parent, circular: parent === dependency, dependency});
    }
};
