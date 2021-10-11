import { Workspace } from "@yarnpkg/core";
import { PackageFiles } from "../../../types";
import { join, dirname } from "path";

const NonRemovableFiles: Record<string, (props: {cwd: string, rootDir: string}) => string[]> = {
    /* 
    Make sure the directory for package is not removed
    */
    directory: ({cwd}) => [cwd],
    /* 
    Make sure that parent directories are not removed, for example a workspace with path:
    /extrafolder/packages/backend

    both /extrafolder
    and /extrafolder/package are kept safe 
    */
    parentDirectories: ({cwd, rootDir}) => {
        if (!cwd.startsWith(rootDir)) {
            throw new Error("Package directory not in rootDir. This should never happen");
        }
        let currentPath = cwd;
        let paths: string[] = [];

        while (true) {
            if (currentPath === rootDir || currentPath.length < rootDir.length) {
                return paths;
            }
            currentPath = dirname(currentPath);
            paths = [...paths, currentPath];
        }
    },
    /* Make sure that package files are kept */ 
    packageFiles: ({cwd}) => PackageFiles.map((fileName) => join(cwd, fileName))
};

const getAllWorkspacesNonRemovablesHelper = ({cwd, rootDir}: {cwd: string, rootDir: string}) => { 
    return [...new Set(...[Object.values(NonRemovableFiles).map((fn) => fn({cwd, rootDir})).flat()])];
};


export const getAllWorkspacesNonRemovables = ({workspaces, rootDir}: {workspaces: Workspace[], rootDir: string}): string[] => {
    return Array.from(workspaces).map(({cwd}) => getAllWorkspacesNonRemovablesHelper({cwd, rootDir})).flat();
};
