#!/usr/bin/env node
/* eslint-disable no-console */

"use strict";

const env = require("./util/env");
const { run } = require("./util/run");

const bundlePath = `${env.repo.root}${env.pkg.path}/bundles/@yarnpkg/${env.pkg.name.replace("yarn-", "")}.js`;

function buildPlugin() {
  try {
    // build the plugin
    run("yarn", ["builder", "build", "plugin", "--no-minify"]);

    // patch the output

    console.log({ bundle_path: bundlePath });
    // the yarn plugin builder always uses the @yarnpkg/ prefix
    // we need to replace it with the actual name of the plugin
    run("replace", [
      `@yarnpkg/${env.pkg.name}`,
      `@yarn.build/${env.pkg.name}`,
      bundlePath,
    ]);

    // yarn plugins cant' use the node: protocol yet, but the latest
    // version of the plugin builder emits it, so we need to replace it
    run("replace", [
      "node:",
      "",
      bundlePath,
    ]);
  } catch (err) {
  console.error(err);
}
}


buildPlugin();

module.exports = {
  buildPlugin,
  bundlePath
};
