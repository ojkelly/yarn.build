import { Project, Workspace, Manifest } from "@yarnpkg/core";
import RunSupervisor from "./index";

const getWorkspaceChildrenRecursive = (
  rootWorkspace: Workspace,
  project: Project
): Array<Workspace> => {
  const workspaceList = [];

  for (const childWorkspaceCwd of rootWorkspace.workspacesCwds) {
    const childWorkspace = project.workspacesByCwd.get(childWorkspaceCwd);

    if (childWorkspace) {
      workspaceList.push(
        childWorkspace,
        ...getWorkspaceChildrenRecursive(childWorkspace, project)
      );
    }
  }

  return workspaceList;
};

const addTargets = async ({
  targetWorkspace,
  project,
  supervisor,
}: {
  targetWorkspace: Workspace;
  project: Project;
  supervisor: RunSupervisor;
}): Promise<void> => {
  if (targetWorkspace.workspacesCwds.size !== 0) {
    // we're in the root, need to run all
    const workspaceList = getWorkspaceChildrenRecursive(
      targetWorkspace,
      project
    );

    for (const workspace of workspaceList) {
      for (const dependencyType of Manifest.hardDependencies) {
        for (const descriptor of workspace.manifest
          .getForScope(dependencyType)
          .values()) {
          const matchingWorkspace =
            project.tryWorkspaceByDescriptor(descriptor);

          if (matchingWorkspace === null) continue;

          await supervisor.addRunTarget(matchingWorkspace);
        }
      }
      await supervisor.addRunTarget(workspace);
    }

    await supervisor.addRunTarget(targetWorkspace);
  } else {
    // we're in a specific target
    await supervisor.addRunTarget(targetWorkspace);
  }
};

export { getWorkspaceChildrenRecursive, addTargets };
