/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Plugin,
  Project,
  Configuration,
  // ProcessEnvironment
} from "@yarnpkg/core";
import { PnpApi } from "@yarnpkg/pnp";
import { dynamicRequire } from "@yarnpkg/pnpify/lib/dynamicRequire";

import fs from "fs";

// import "./Manifest";
import { patchFs } from "@yarnpkg/fslib";
import { PackageYamlFS } from "./PackageYamlFS";
let fsPatched = false;

let pnp: PnpApi;

try {
  pnp = dynamicRequire(`pnpapi`);
} catch (e) {}

const patchFileSystem = () => {
  if (!fsPatched) {
    const realFs: typeof fs = { ...fs };
    const patchedFs = new PackageYamlFS(realFs);

    patchFs(fs, patchedFs);
    fsPatched = true;
  }
};

patchFileSystem();

console.log("plugin-package-yaml", { fsPatched });

// const _originalConfigurationFind = Configuration.find;

// Configuration.find = async function find(...args) {
//   console.log("config.find", ...args);
//   const configuration = await _originalConfigurationFind(...args);

//   return configuration;
// };

// function traceMethodCalls(obj: any) {
//   const handler = {
//     get(target: { [x: string]: any }, propKey: string, receiver: any) {
//       const origMethod = target[propKey];

//       return (...args: any) => {
//         const result = origMethod.apply(this, args);

//         console.log(
//           propKey + JSON.stringify(args) + " -> " + JSON.stringify(result)
//         );

//         return result;
//       };
//     },
//   };

//   console.log("make proxy");

//   return new Proxy(obj, handler);
// }

// const Singleton = (function () {
//   let instance: typeof Proxy;

//   function createInstance(): typeof Proxy {
//     console.log("Singleton.createInstance");

//     // return traceMethodCalls(require("fs").promises);
//     return traceMethodCalls(NodeFS);
//   }

//   return {
//     getInstance: function () {
//       if (!instance) {
//         instance = createInstance();
//       }
//       console.log("Singleton.getInstance");

//       return instance;
//     },
//   };
// })();

// Singleton.getInstance();

// const writeFileHandler = {
//   apply: async function (target, that, args) {
//     const [filename, data, encoding = ""] = args;
//     const encryptedText = await cryptoHelper.encrypt(data);

//     return target(filename, encryptedText, encoding);
//   },
// };

// const readFileHandler = {
//   apply: async function (target, that, args) {
//     const data = await target(...args);
//     const decrypted = await cryptoHelper.decrypt(data);

//     return decrypted;
//   },
// };

// const promisesHandler = {
//   get: function (target, prop, receiver) {
//     switch (prop) {
//       case "writeFile":
//         return new Proxy(target[prop], writeFileHandler);

//       case "readFile":
//         return new Proxy(target[prop], readFileHandler);

//       default:
//         return Reflect.get(...arguments);
//     }
//   },
// };

// const customFsPromises = new Proxy(require("fs").promises, promisesHandler);

async function setupScriptEnvironment(
  project: Project,
  env: { [key: string]: string },
  makePathWrapper: (
    name: string,
    argv0: string,
    args: Array<string>
  ) => Promise<void>
): Promise<void> {
  // const configuration = project.configuration.get(`portableShell`);
  // if (configuration.get(`onlyLocalCommands`)) {
  //   env.PATH = env.BERRY_BIN_FOLDER;
  // }
  // if (configuration.get(`envWhitelist`)) {
  //   const whitelist = new Set<string>(
  //     [].concat(configuration.get(`envWhitelist`))
  //   );
  //   // always whitelist:
  //   // - the path to allow commands to work
  //   whitelist.add(`PATH`);
  //   // - the berry bin folder, because berry needs it
  //   whitelist.add(`BERRY_BIN_FOLDER`);
  //   // - the node options because we use it to insert pnp into any node commands
  //   whitelist.add(`NODE_OPTIONS`);
  //   const envKeys = Object.keys(env);
  //   const allowedDependencies = new Set(micromatch(envKeys, [...whitelist]));
  //   for (const key of envKeys) {
  //     if (!allowedDependencies.has(key)) {
  //       delete env[key];
  //     }
  //   }
  // }
}

const plugin: Plugin = {
  hooks: {
    setupScriptEnvironment,
  },
};

export default plugin;
