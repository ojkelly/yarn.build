import { FormatType, Workspace } from "@yarnpkg/core";
import { getName } from "../../utils";
import { DisplayFormatType } from "../displayFormatType";
import { paddingLeft } from "../paddingLeft";

interface DisplayNameProps {
    workspace: Workspace;
    padding?: number;
    format: DisplayFormatType;
}

const COLOR = FormatType.NAME;

export const displayName = ({format, workspace, padding = 0}: DisplayNameProps): void => {
    const {name: value} = workspace.manifest;
    const name = getName(value);

    paddingLeft({format, padding});
    process.stdout.write(format(name, COLOR));
    process.stdout.write("\n");
};
