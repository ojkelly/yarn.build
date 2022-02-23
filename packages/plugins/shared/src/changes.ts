import { exec } from "child_process";
import { Workspace } from "@yarnpkg/core";
import { PortablePath } from "@yarnpkg/fslib";

async function GetChangedWorkspaces(options: {
  root: Workspace;
  commit?: string;
  sinceBranch?: string;
}): Promise<Workspace[]> {
  return new Promise((resolve, reject) => {
    let cmd = "";

    if (options.commit) {
      cmd = `git diff --name-only HEAD~${options.commit}`;
    }
    if (options.sinceBranch && options.sinceBranch.length > 0) {
      cmd = `git diff --name-only ${options.sinceBranch}...`;
    }

    if (cmd.length === 0) {
      throw new Error("Unable to determine how to detect changes.");
    }
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      if (stdout) {
        const files = stdout.split("\n");
        const matched = [...options.root.workspacesCwds]
          .map((workspacePath) => {
            if (
              files.some((v) =>
                v.startsWith(workspacePath.replace(`${options.root.cwd}/`, ""))
              )
            ) {
              return workspacePath;
            }

            return undefined;
          })
          .filter((item): item is PortablePath => !!item);

        const r = matched
          .map((p) => !!p && options.root.project.workspacesByCwd.get(p))
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
