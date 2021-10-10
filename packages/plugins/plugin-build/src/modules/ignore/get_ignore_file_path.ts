import { Filename } from "@yarnpkg/fslib";
import { join } from "path";

interface GetIgnoreFileProps {
    ignoreFile: Filename;
    cwd: string;
}

export const getIgnoreFilePath = ({ignoreFile, cwd}: GetIgnoreFileProps): Filename => {
    return join(cwd, ignoreFile) as Filename;
};
