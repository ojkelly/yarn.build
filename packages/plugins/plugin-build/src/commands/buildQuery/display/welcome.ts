import { DisplayFormatType } from "./displayFormatType";
import { Workspace } from "@yarnpkg/core";
import { getName } from "../utils";
import { paddingTop } from "./paddingTop";

interface WelcomeProps {
    workspace: Workspace;
    format: DisplayFormatType
}
export const Welcome = ({workspace, format}: WelcomeProps): void => {
    const name = getName(workspace.manifest.name);

    process.stdout.write(`Build query for package: ${format(name, 'bold')}`);
    paddingTop({padding: 1});
};
