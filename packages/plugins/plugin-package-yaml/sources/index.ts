/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Plugin,
  Project,
  Configuration,
  // ProcessEnvironment
} from "@yarnpkg/core";
import fs from "fs";

import { patchFs, NodeFS, PortablePath, NativePath } from "@yarnpkg/fslib";
import { PackageYamlFS } from "./PackageYamlFS";
let fsPatched = false;

const patchFileSystem = (realFs: typeof fs) => {
  if (!fsPatched) {
    const patchedFs = new PackageYamlFS({ ...realFs });

    patchFs(fs, patchedFs);
    fsPatched = true;
  }
  // console.log("patchFileSystem", fsPatched, process.pid);
};

patchFileSystem(fs);

async function setupScriptEnvironment(
  project: Project,
  env: { [key: string]: string },
  makePathWrapper: (
    name: string,
    argv0: string,
    args: Array<string>
  ) => Promise<void>
): Promise<void> {
  //   console.log("setupScriptEnvironment", process.pid);
}

const plugin: Plugin = {
  hooks: {
    setupScriptEnvironment,
  },
};

export default plugin;
