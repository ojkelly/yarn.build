import { exec } from "child_process";
import { Workspace } from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";

async function GetChangedWorkspaces(
  root: Workspace,
  commit: string
): Promise<Workspace[]> {
  return new Promise((resolve, reject) => {
    exec(`git diff --name-only HEAD~${commit}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      if (stdout) {
        const files = stdout.split("\n");
        const matched = [...root.workspacesCwds]
          .map((workspacePath) => {
            if (
              files.some((v) =>
                v.startsWith(workspacePath.replace(`${root.cwd}/`, ""))
              )
            ) {
              return workspacePath;
            }

            return undefined;
          })
          .filter((item): item is PortablePath => !!item);

        const r = matched
          .map((p) => !!p && root.project.workspacesByCwd.get(p))
          .filter((item): item is Workspace => !!item);

        resolve(r);
      }
      if (stderr) {
        resolve([]);
      }
    });
  });
}

export { GetChangedWorkspaces };
