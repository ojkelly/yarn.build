/* eslint-disable @typescript-eslint/no-unused-vars */
import { Plugin } from "@yarnpkg/core";

import fs from "fs";

import { patchFs } from "@yarnpkg/fslib";
import { PackageYamlFS } from "./PackageYamlFS";
let fsPatched = false;

const patchFileSystem = (realFs: typeof fs) => {
  if (!fsPatched) {
    const patchedFs = new PackageYamlFS({ ...realFs });

    patchFs(fs, patchedFs);
    fsPatched = true;
  }
};

patchFileSystem(fs);

// This plugin patches `fs` in yarn, but not in pnp.cjs at this time.
// as such, we export an empty plugin.
const plugin: Plugin = {};

export default plugin;
