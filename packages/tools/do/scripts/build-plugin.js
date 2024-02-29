#!/usr/bin/env node
/* eslint-disable no-console */

"use strict";

const env = require("./util/env");
const { run } = require("./util/run");
const replace = require("replace");

const bundlePath = `${env.repo.root}${env.pkg.path}/bundles/@yarnpkg/${env.pkg.name.replace("yarn-", "")}.js`;

function buildPlugin() {
  try {
    // build the plugin
    run("yarn", ["builder", "build", "plugin", "--no-minify"]);

    // patch the output
    console.log({
      regex: `@yarnpkg/${env.pkg.name.replace("yarn-", "")}`,
      replacement: `@yarn.build/${env.pkg.name.replace("yarn-", "")}`,
      paths: [bundlePath],
      recursive: false,
      silent: false,
    });

    // the yarn plugin builder always uses the @yarnpkg/ prefix
    // we need to replace it with the actual name of the plugin
    replace({
      // the package must be named with `yarn-` as a prefix, which is
      // stripped when compiled.
      // Then we need to replace it to our org name
      regex: `@yarnpkg/${env.pkg.name.replace("yarn-", "")}`,
      replacement: `@yarn.build/${env.pkg.name.replace("yarn-", "")}`,
      paths: [bundlePath],
      recursive: false,
      silent: false,
    });

    // yarn plugins cant' use the node: protocol yet, but the latest
    // version of the plugin builder emits it, so we need to replace it
    replace({
      regex: `node:`,
      replacement: ``,
      paths: [bundlePath],
      recursive: false,
      silent: false,
    });
  } catch (err) {
    console.error(err);
  }
}


buildPlugin();

module.exports = {
  buildPlugin,
  bundlePath
};
