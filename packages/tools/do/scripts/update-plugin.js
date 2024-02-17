#!/usr/bin/env node
/* eslint-disable no-console */

"use strict";

const env = require("./util/env");
const fs = require("fs-extra");

// build the plugin and update it in the workspace

const {bundlePath, buildPlugin} = require("./build-plugin");
const pluginFolder = `${env.repo.root}/.yarn/plugins/@${env.pkg.scope}`;

buildPlugin();

// update the plugin in the workspace
try {
  if (!fs.existsSync(pluginFolder)) {
    fs.mkdirSync(pluginFolder);
  }
} catch (err) {
  console.error(err);
}


try {
  fs.copyFileSync(bundlePath, `${pluginFolder}/${env.pkg.name}.cjs`);
}
catch (err) {
  console.error(err);
}
