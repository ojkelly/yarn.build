#!/usr/bin/env node

"use strict";

const env = require("./util/env");
const fs = require("fs-extra");

// Clean -----------------------------------------------------------------------
//
// const {bundlePath} = require("./build-plugin");

const bundlePath = `${env.repo.root}${env.pkg.path}/bundles`;

// if (bundlePath.startsWith(env.repo.root)) {
  console.log(`Cleaning up ${bundlePath}`);
  try {
    fs.removeSync(bundlePath);
  } catch (err) {
    console.error(err);
  }
// }
