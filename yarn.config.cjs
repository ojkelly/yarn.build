/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types");

module.exports = defineConfig({
  async constraints({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
      // Enforce consistent engines across all workspaces that specify them
      if (workspace.manifest.engines?.node) {
        workspace.set("engines.node", ">=22.2.0");
      }

      // Enforce workspace:^ for internal dependencies
      for (const dep of Yarn.dependencies({ ident: workspace.ident })) {
        if (dep.type === "dependencies" || dep.type === "devDependencies") {
          if (dep.range.startsWith("workspace:")) {
            dep.update("workspace:^");
          }
        }
      }
    }
  },
});
