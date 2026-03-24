import { execFile } from "child_process";
import { promisify } from "util";
import { Workspace } from "@yarnpkg/core";

const execFileAsync = promisify(execFile);

interface Options {
  root: Workspace;
  commit?: string;
  sinceBranch?: string;
}

function getArgs(options: Options): string[] {
  const { commit, sinceBranch } = options;

  if (commit) {
    return ["diff", "--name-only", `..${commit}`];
  }

  if (sinceBranch) {
    return ["diff", "--name-only", `${sinceBranch}...`];
  }

  throw new Error("Unable to determine how to detect changes.");
}

export async function GetChangedWorkspaces(
  options: Options,
): Promise<Workspace[]> {
  try {
    const args = getArgs(options);
    const { stdout } = await execFileAsync("git", args);
    const files = stdout.split("\n");

    const changedWorkspaces = options.root.project.workspaces.filter(
      (workspace) =>
        files.some((file) =>
          file.startsWith(workspace.relativeCwd.replace(/^\.\//, "")),
        ),
    );

    const allDependents = changedWorkspaces.reduce((acc, workspace) => {
      const dependents = workspace.getRecursiveWorkspaceDependents();

      return new Set([...acc, ...dependents, workspace]);
    }, new Set<Workspace>());

    return Array.from(allDependents.values());
  } catch {
    return [];
  }
}
