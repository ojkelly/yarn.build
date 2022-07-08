export const Attribute = {
  PACKAGE_NAME: "package.name",
  PACKAGE_SCOPE: "package.scope",
  PACKAGE_DIRECTORY: "package.directory",
  PACKAGE_COMMAND: "package.command",

  // VCS
  GIT_BRANCH: "git.branch",
  GIT_COMMIT: "git.commit",

  YARN_BUILD_MESSAGE_CODE: "yarn.build.message.code",

  // Yarn.build flags
  YARN_BUILD_CONFIG_FOLDERS_INPUT: "yarn.build.config.folders.input",
  YARN_BUILD_CONFIG_FOLDERS_OUTPUT: "yarn.build.config.folders.output",
  YARN_BUILD_CONFIG_EXCLUDE: "yarn.build.config.exclude",
  YARN_BUILD_CONFIG_BAIL: "yarn.build.config.bail",
  YARN_BUILD_CONFIG_HIDE_BADGE: "yarn.build.config.hide-badge",
  YARN_BUILD_CONFIG_MAX_CONCURRENCY: "yarn.build.config.max-concurrency",

  // yarn build
  YARN_BUILD_FLAGS_OUTPUT_JSON: "yarn.build.flags.output.json",
  YARN_BUILD_FLAGS_ALL: "yarn.build.flags.all",
  YARN_BUILD_FLAGS_TARGETS: "yarn.build.flags.targets",
  YARN_BUILD_FLAGS_COMMAND: "yarn.build.flags.command",
  YARN_BUILD_FLAGS_INTERLACED: "yarn.build.flags.interlaced",
  YARN_BUILD_FLAGS_VERBOSE: "yarn.build.flags.verbose",
  YARN_BUILD_FLAGS_DRY_RUN: "yarn.build.flags.dry-run",
  YARN_BUILD_FLAGS_IGNORE_CACHE: "yarn.build.flags.ignore-cache",
  YARN_BUILD_FLAGS_MAX_CONCURRENCY: "yarn.build.flags.max-concurrency",
  YARN_BUILD_FLAGS_CONTINUE_ON_ERROR: "yarn.build.flags.continue-on-error",
  YARN_BUILD_FLAGS_EXCLUDE: "yarn.build.flags.exclude",
  YARN_BUILD_FLAGS_EXCLUDE_CURRENT: "yarn.build.flags.exclude.current",
  YARN_BUILD_FLAGS_CHANGES: "yarn.build.flags.changes",
  YARN_BUILD_FLAGS_SINCE: "yarn.build.flags.since",
  YARN_BUILD_FLAGS_SINCE_BRANCH: "yarn.build.flags.since-branch",
  YARN_BUILD_FLAGS_ONLY_CURRENT: "yarn.build.flags.only-current",

  // yarn bundle
  YARN_BUILD_FLAGS_BUNDLE_QUIET: "yarn.build.flags.bundle.quiet",
  YARN_BUILD_FLAGS_BUNDLE_TEMPORARY_DIRECTORY:
    "yarn.build.flags.bundle.temporary-directory",
  YARN_BUILD_FLAGS_BUNDLE_OUTPUT_DIRECTORY:
    "yarn.build.flags.bundle.output-directory",
  YARN_BUILD_FLAGS_BUNDLE_NO_COMPRESS: "yarn.build.flags.bundle.no-compress",
  YARN_BUILD_FLAGS_BUNDLE_ARCHIVE_NAME: "yarn.build.flags.bundle.archive-name",
  YARN_BUILD_FLAGS_BUNDLE_EXCLUDE: "yarn.build.flags.bundle.exclude",
  YARN_BUILD_FLAGS_BUNDLE_IGNORE_FILE: "yarn.build.flags.bundle.ignore-file",

  // Yarn.build per package attributes
  YARN_BUILD_PACKAGE_NEEDS_RUN: "yarn.build.package.needs-run",
  YARN_BUILD_PACKAGE_RUN_COMMAND: "yarn.build.package.run.command",
  YARN_BUILD_PACKAGE_RUN_COMMAND_EXIT: "yarn.build.package.run.command.exit",
};
