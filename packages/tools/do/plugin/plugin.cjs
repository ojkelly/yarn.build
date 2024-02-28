
// This is a yarn plugin that has been registered with this repo in `./.yarnrc.yml`
module.exports = {
  name: `plugin-do`,
  factory: (require) => {
    const {   structUtils } = require('@yarnpkg/core');

    return {
      hooks: {
        // https://yarnpkg.com/advanced/plugin-tutorial#hook-setupScriptEnvironment
        setupScriptEnvironment: async (project, scriptEnv) => {
          const pe = populateEnv(scriptEnv);

          Object.keys(pe.env).forEach((k) => {
            scriptEnv[k] = pe.env[k];
          });
        },
        // https://yarnpkg.com/advanced/plugin-tutorial#hook-registerPackageExtensions
        registerPackageExtensions: async (configuration, registerPackageExtension) => {
          // In this hook we are making every local package (workspace)
          // depend on the `@tools/do` package. This makes `do` available
          // in every local package.
          const { Project } = require('@yarnpkg/core');
          const { workspace: rootWorkspace } = await Project.find(configuration, configuration.projectCwd);
          const workspaces = rootWorkspace.getRecursiveWorkspaceChildren();

          workspaces.forEach((w) => {
            registerPackageExtension(
              structUtils.makeDescriptor(
                structUtils.makeIdent(
                  w.manifest.name.scope,
                  w.manifest.name.name,
                ), '*'), {
              dependencies: {
                '@tools/do': 'workspace:*',
                // You can also add your own dependencies here
                // 'typescript': '*',
                // 'eslint': '*',
                // 'prettier': '*',
              }
            });
          });
        }
      }
    };
  },

  // export the function here for use in other scripts
  populateEnv
};

/**
 * Populates the environment variables for the package.
 *
 * populateEnv prepares and add ENV variables to every script that is run via yarn
 * this enables us to have a consistent and rich set of ENV vars to use and depend
 * on in our tooling.
 *
 * as an example it enables the same deployment script to be used across packages
 * as variables for the commit hash and service are passed in.
 *
 *
 * @param {Object} prevEnv - The previous environment variables.
 * @returns {Object} - An object containing the updated environment variables and package metadata.
 */
function populateEnv(prevEnv) {
  let env = {

  };

    const packagePath = prevEnv["INIT_CWD"].replace(prevEnv["PROJECT_CWD"], "");
  const packageName = prevEnv["npm_package_name"];
  const splitPackageName = packageName.replace("@", "").split("/");
  const packageScope = splitPackageName[0];
  const packageOrdinaryName = splitPackageName[1];

      env.INIT_CWD = prevEnv["INIT_CWD"];

    env.PROJECT_CWD = prevEnv["PROJECT_CWD"];

    // relative path from repository root
    env.PACKAGE_PATH = packagePath;

      env.PACKAGE_BUILD_FOLDER = ".build";
    // verbatim name of the package
    env.PACKAGE_RAW_NAME = packageName;

    // package scope
    env.PACKAGE_SCOPE = packageScope;

    // package name without scope
    env.PACKAGE_NAME = packageOrdinaryName;

  return {
    env: {
      ...prevEnv,
      ...env,
    },
    repo: {
      root: env.PROJECT_CWD,
    },
    // other keys can share metadata with scripts but not the env
    pkg: {
      path: env.PACKAGE_PATH,
      raw_name: env.PACKAGE_RAW_NAME,
      scope: env.PACKAGE_SCOPE,
      name: env.PACKAGE_NAME,
      buildFolder: env.PACKAGE_BUILD_FOLDER,
    },
    // git: {
    //   commit: env.GIT_COMMIT_HASH,
    //   status: env.GIT_BRANCH,
    //   branch: env.GIT_BRANCH,
    // },
  };
}
