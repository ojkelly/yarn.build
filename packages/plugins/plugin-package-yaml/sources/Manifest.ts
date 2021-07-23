import fs from "fs";
import {
  NodeFS,
  FakeFS,
  NativePath,
  patchFs,
  PortablePath,
} from "@yarnpkg/fslib";
import { Manifest } from "@yarnpkg/core";
import YAWN from "yawn-yaml/cjs";

// export function extendFs(
//   realFs: typeof fs,
//   fakeFs: FakeFS<NativePath>
// ): typeof fs {
//   const patchedFs = Object.create(realFs);

//   patchFs(patchedFs, fakeFs);

//   return patchedFs;
// }

// function traceMethodCalls(obj: any, name: string) {
//   const handler = {
//     get(target: { [x: string]: any }, propKey: string, receiver: any) {
//       const origMethod = target[propKey];

//       return (...args: any) => {
//         const result = origMethod.call(this, args);

//         console.log(name + ":" + propKey + JSON.stringify(args));

//         return result;
//       };
//     },
//   };

//   console.log("make proxy for", name);

//   return new Proxy(obj, handler);
// }

// eslint-disable-next-line @typescript-eslint/ban-types
class FSProxyHandler<T extends object> {
  private readonly realFs: FakeFS<PortablePath>;

  constructor(realFs: FakeFS<PortablePath>) {
    this.realFs = realFs;
  }

  get(target: T, property: string | symbol, receiver: unknown) {
    if (typeof property == `string`) {
      switch (property) {
        case "readFilePromise":
          console.log("FSProxyHandler readFilePromise", property, receiver);
          break;

        case "realFs":
          console.log("FSProxyHandler realFs", property, receiver);
          break;

        case "existsPromise":
          console.log("FSProxyHandler existsPromise", property, receiver);
          break;
      }
    }

    return target[property as keyof typeof target];
  }
}

const originalManifest = {
  tryFind: Manifest.tryFind,
  find: Manifest.find,
  fromFile: Manifest.fromFile,
};

Manifest.tryFind = async function tryFind(
  path: PortablePath,
  { baseFs }: { baseFs?: FakeFS<PortablePath> } = {}
) {
  if (baseFs) {
    console.log("tryFind");
    const proxiedFs = new Proxy(baseFs, new FSProxyHandler(baseFs));

    return await originalManifest.tryFind(path, { baseFs: proxiedFs });
  }

  return await originalManifest.tryFind(path, { baseFs });
};

Manifest.find = async function find(
  path: PortablePath,
  { baseFs }: { baseFs?: FakeFS<PortablePath> } = {}
) {
  if (baseFs) {
    console.log("tryFind");

    const proxiedFs = new Proxy(baseFs, new FSProxyHandler(baseFs));

    return await originalManifest.find(path, { baseFs: proxiedFs });
  }

  return await originalManifest.find(path, { baseFs });
};

Manifest.fromFile = async function fromFile(
  path: PortablePath,
  { baseFs }: { baseFs?: FakeFS<PortablePath> } = {}
) {
  if (baseFs) {
    console.log("tryFind");

    const proxiedFs = new Proxy(baseFs, new FSProxyHandler(baseFs));

    return await originalManifest.fromFile(path, { baseFs: proxiedFs });
  }

  return await originalManifest.fromFile(path, { baseFs });
};

// const _originalConfigurationFind = Configuration.find;
// Configuration.find = async function find(...args) {
//   const configuration = await _originalConfigurationFind(...args);
//   await maybeSetAuthToken({ configuration });
//   return configuration;
// };

// NodeFS.existsPromise = async (p: PortablePath) {
//     return await new Promise<boolean>(resolve => {
//       // console.log(`existsPromise`, {p});

//       const loadYmlManifest = () => {
//         const pkgYmlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yml`;
//         const pkgYmlExists = this.realFs.existsSync(npath.fromPortablePath(pkgYmlPath));
//         // console.log(`existsPromise`, {pkgYmlPath, pkgYmlExists});

//         if (pkgYmlExists)
//           resolve(pkgYmlExists);

//         const pkgYamlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yaml`;
//         const pkgYamlExists = this.realFs.existsSync(npath.fromPortablePath(pkgYamlPath));
//         // console.log(`existsPromise`, {pkgYamlPath, pkgYamlExists});

//         if (pkgYamlExists) {
//           resolve(pkgYamlExists);
//         }
//       };

//       if (p.toString().endsWith(`package.json`)) {
//         const pkgJsonExists = this.realFs.existsSync(npath.fromPortablePath(p));

//         if (pkgJsonExists) {
//           resolve(pkgJsonExists);
//         } else {
//           loadYmlManifest();
//         }
//       }

//       if (p.toString().endsWith(`package.yml`) || p.toString().endsWith(`package.yaml`)) {
//         loadYmlManifest();
//         return;
//       }

//       this.realFs.exists(npath.fromPortablePath(p), resolve);
//     });
//   }
