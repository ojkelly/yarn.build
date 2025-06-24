
/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

/** @type {import('@types/semver')} */
const semver = require('semver');

/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Workspace} Workspace
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Dependency} Dependency
 */

const IGNORE_CONSISTENT_DEPENDENCIES_FOR = new Set([`.`]);

/**
 * @param {Context} context
 */
function enforceRootDependencies({ Yarn }) {
  const root = Yarn.workspace({ cwd: '.' });

  if (root === null) {
    throw new Error('Root workspace not found');
  }

  const missingRootDeps = new Map();

  for (const dependencyA of Yarn.dependencies()) {
    if (dependencyA.range.startsWith('workspace:')) continue;

    // If dep is * and it's in the root deps update it to the root dep
    // if (dependencyA.range === '*') {
    if (root.manifest.dependencies[dependencyA.ident]) {
      dependencyA.update(root.manifest.dependencies[dependencyA.ident]);
      continue;
    } else {
      missingRootDeps.set(dependencyA.ident, dependencyA.range);

      for (const otherDependency of Yarn.dependencies({
        ident: dependencyA.ident,
      })) {
        if (IGNORE_CONSISTENT_DEPENDENCIES_FOR.has(otherDependency.workspace.cwd)) continue;

        if (otherDependency.type === `peerDependencies`) continue;

        if (
          (dependencyA.type === `devDependencies` || otherDependency.type === `devDependencies`) &&
          Yarn.workspace({ ident: otherDependency.ident })
        )
          continue;

        dependencyA.update(otherDependency.range);
      }
    }
  }

  for (const [ident, range] of missingRootDeps.entries()) {
    root.set(['dependencies', ident], range);
  }
}

/**
/**
 * This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
 * We allow Docusaurus to have different dependencies for now; will be addressed later (when we remove Gatsby)
 * @param {Context} context
 */
function enforceWorkspaceDependenciesWhenPossible({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (!Yarn.workspace({ ident: dependency.ident })) continue;

    dependency.update(`workspace:^`);
  }
}

/**
 * @param {Context} context
 * @param {Record<string, ((workspace: Workspace) => any) | string>} fields
 */
function enforceFieldsOnAllWorkspaces({ Yarn }, fields) {
  for (const workspace of Yarn.workspaces()) {
    for (const [field, value] of Object.entries(fields)) {
      workspace.set(field, typeof value === `function` ? value(workspace) : value);
    }
  }
}

module.exports = defineConfig({
  constraints: async (ctx) => {
    enforceRootDependencies(ctx);
    enforceWorkspaceDependenciesWhenPossible(ctx);
    enforceFieldsOnAllWorkspaces(ctx, {
      [`engines.node`]: `>=22.2.0`,
    });
  },
});
