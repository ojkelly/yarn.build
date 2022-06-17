import { Project, Workspace, Manifest, formatUtils } from "@yarnpkg/core";
import RunSupervisor from "./index";
import { CyclicDependencyError } from "./graph";

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
  try {
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
          await supervisor.addRunTarget(workspace);
        }
      }

      await supervisor.addRunTarget(targetWorkspace);
    } else {
      // we're in a specific target
      await supervisor.addRunTarget(targetWorkspace);
    }
  } catch (err) {
    if (err instanceof CyclicDependencyError) {
      let msg = `${supervisor.formatHeader("FATAL")}

You have a cyclic dependency.`;

      const topArrow = err.node.length < err.dep.length + 4 ? "↰" : "";
      const btmArrow = err.node.length > err.dep.length + 4 ? "⤴" : "";

      msg += `

${formatUtils.pretty(supervisor.configuration, err.node, "white")} ${topArrow}
 ↳ ${formatUtils.pretty(supervisor.configuration, err.dep, "red")} ${btmArrow}

`;

      msg += formatUtils.pretty(
        supervisor.configuration,
        `
---

To fix this error you must remove the cyclic dependency.

Workspaces cannot directly or indirectly depend on each other. When running
the provided command yarn.build uses a parallelsied topological sort. This
maximises throughput (saving you time) while ensuring dependencies are run in
the order declared.

In a cyclic dependency A depends on B, which depends on A. Or in an indirect cyclic
dependency, A depends on B, which depends on C, and C depends on A.

In both cases A cannot be built, because to we cannot determine which one goes
first.

---
While some tooling may adapt to cyclic dependencies yarn.build cannot. Doing so
is unsound and unpredictable which goes against the stated goals of the tool.

In most cases this issue occurs by accident when you delcare a dependency on the
wrong package.

In some cases you may actually want the cyclic dependency. As that's not
possible, find the parts that are shared and move them to their own package
that both packages can depend on.
---

`,
        `grey`
      );
      msg += formatUtils.pretty(
        supervisor.configuration,
        `FATAL: You have a cyclic dependency.`,
        "red"
      );

      console.error(msg);
      process.exit(2);
    } else {
      console.error("An error occured in yarn.build.", err);
    }
  }
};

export { getWorkspaceChildrenRecursive, addTargets };
