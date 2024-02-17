/* eslint-disable no-console */
"use strict";

const spawn = require("cross-spawn");

// TODO: not currently cross platform
// needs linux, macos, or WSL


/**
 * Executes a command with arguments and options.
 *
 * @param {string} cmd - The command to execute.
 * @param {string[]} args - The arguments to pass to the command.
 * @param {object} [opts={ env: {} }] - The options for executing the command.
 * @param {object} [opts.env={}] - The environment variables to set for the command.
 */
function run(cmd, args, opts = { env: {} }) {
  console.log(`run: ${cmd} ${args.join(" ")}`);
  const result = spawn.sync(cmd, args, {
    stdio: "inherit",
    ...opts,
    env: {
      ...process.env,
      ...opts.env,
    },
  });

  if (result.status != 0) {
    process.exit(result.status);
  }
}

module.exports = {
  run,
};
