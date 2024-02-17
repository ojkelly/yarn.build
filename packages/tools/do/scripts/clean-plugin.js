#!/usr/bin/env node
/* eslint-disable no-console */

"use strict";

const env = require("./util/env");
const fs = require("fs-extra");

// Clean -----------------------------------------------------------------------

const bundlePath = `${env.repo.root}${env.pkg.path}/bundles`;

console.log(`Cleaning up ${bundlePath}`);
try {
  fs.removeSync(bundlePath);
} catch (err) {
  console.error(err);
}
