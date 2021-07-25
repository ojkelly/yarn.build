/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  CreateReadStreamOptions,
  CreateWriteStreamOptions,
} from "@yarnpkg/fslib";
import { FakeFS, WriteFileOptions, ProxiedFS } from "@yarnpkg/fslib";
import { WatchOptions, WatchCallback, Watcher } from "@yarnpkg/fslib";
import { FSPath, NativePath, PortablePath, npath, ppath } from "@yarnpkg/fslib";
import { RmdirOptions } from "@yarnpkg/fslib";
import {
  Dirent,
  Filename,
  MkdirOptions,
  WatchFileCallback,
  WatchFileOptions,
  StatWatcher,
  OpendirOptions,
  Dir,
  SymlinkType,
} from "@yarnpkg/fslib";

import fs, { BigIntStats, Stats } from "fs";
import { load } from "js-yaml";
import YAWN from "yawn-yaml/cjs";

import { LruCache } from "./lru";

export class PackageYamlFS extends ProxiedFS<NativePath, PortablePath> {
  protected readonly baseFs: PortablePackageYamlFS;

  constructor(realFs: typeof fs) {
    super(npath);
    this.baseFs = new PortablePackageYamlFS(realFs);
  }

  protected mapFromBase(path: PortablePath) {
    return npath.fromPortablePath(path);
  }

  protected mapToBase(path: NativePath) {
    return npath.toPortablePath(path);
  }

  patchManifestPath(p: PortablePath): PortablePath {
    return this.baseFs.patchManifestPath(p);
  }
}

export abstract class BasePortableFakeFS extends FakeFS<PortablePath> {
  protected constructor() {
    super(ppath);
  }
}

const ManifestFiles = ["package.json", "package.yaml", "package.yml"] as const;

type ManifestFilename = typeof ManifestFiles[number];

// TODO: Read methods
// TODO: Write methods
export class PortablePackageYamlFS extends BasePortableFakeFS {
  private readonly realFs: typeof fs;

  // Package.json mapping cache
  //
  // To check if a file has been remapped from package.json to package.yaml
  // we need to read off the file system. This is expensive, and has the
  // potential to end up in infinite loops if we're not careful.
  //
  // This cache is is limited to just those files which we think are
  // pakage.json manifests, and it only remembers the last 100.
  // Even then, it can dramatically cut down on what was a performance hit.
  //
  // For any fs methods that may remove or rename the file, we remove their
  // cache entry. So that next time it needs to be accessed, it can be
  // checked on the filesystem again.
  //
  // This will (most likely) only fail if another program alters the file
  // during a process.
  protected cache: LruCache<string>;

  constructor(realFs: typeof fs = fs) {
    super();

    this.realFs = { ...realFs };
    this.cache = new LruCache();
  }

  // package.yaml stuff

  convertManifestPath(p: PortablePath, f: ManifestFilename): PortablePath {
    const str = p.toString();
    const rest = str.substring(0, str.lastIndexOf("/") + 1);

    return `${rest}${f}` as PortablePath;
  }

  isPathForManifest(p: PortablePath): false | ManifestFilename {
    const str = p.toString();
    const file = str.substring(str.lastIndexOf("/") + 1, str.length);

    return ManifestFiles.includes(file as ManifestFilename)
      ? (file as ManifestFilename)
      : false;
  }

  doesManifestExist(p: PortablePath): ManifestFilename | undefined {
    const str = p.toString();
    const rest = str.substring(0, str.lastIndexOf("/") + 1);

    return ManifestFiles.find((manifest) => {
      return this.realFs.existsSync(
        npath.fromPortablePath(`${rest}${manifest}`)
      );
    });
  }

  patchManifestPath(p: PortablePath): PortablePath {
    const cached = this.cache.get(p);

    if (typeof cached !== "undefined") {
      return cached as PortablePath;
    }

    let patched = p;

    if (!!this.isPathForManifest(p)) {
      const manifestName = this.doesManifestExist(p);

      if (typeof manifestName !== "undefined") {
        patched = this.convertManifestPath(p, manifestName);
      }

      this.cache.set(p, patched);
      // console.log("patchManifestPath", { manifestName, p, patched });
      // console.trace();
    }

    return patched;
  }

  // read the manifest file if it's yaml, and return it as json
  readManifestFile(p: PortablePath, encoding?: string): false | string {
    try {
      const manifestType = this.isPathForManifest(p);

      // bail if we don't need to do anything
      if (manifestType === false || manifestType == "package.json") {
        return false;
      }

      const fsNativePath =
        typeof p === `string` ? npath.fromPortablePath(p) : p;

      const data = this.realFs.readFileSync(
        fsNativePath,
        encoding as
          | BufferEncoding
          | (fs.BaseEncodingOptions & { flag?: string | undefined })
          | null
          | undefined
      );
      let rawManifest = ``;

      if (data instanceof Buffer) {
        rawManifest = data.toString();
      } else {
        rawManifest = data;
      }
      const pkgYml = load(rawManifest);

      // convert it back to json for compatibility
      return JSON.stringify(pkgYml);
    } catch {
      // err's ignored, we'll hand off to the normal file reader
    }

    return false;
  }

  /// If p is for a non package.json manifest file write it, otherwise bail
  // The .yaml/.yml manifest file must be on disk, otherwsise a .json will
  // be defaulted to
  writeManifestFile(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    manifestFilename: ManifestFilename,
    opts?: WriteFileOptions
  ): boolean {
    if (typeof content === `string` || Buffer.isBuffer(content)) {
      // hand this one back to be written as normal
      if (manifestFilename == "package.json") {
        return false;
      }

      const mJsonStr: string = Buffer.isBuffer(content)
        ? content.toString()
        : content;

      const manifestObject = JSON.parse(mJsonStr);

      const nativeManifestPath = npath.fromPortablePath(p as PortablePath);

      try {
        const rawManifest = this.realFs.readFileSync(
          nativeManifestPath,
          `utf-8`
        );

        // load yaml off disk
        const manifestYawn = new YAWN(rawManifest);

        // merge json, to preserve comments
        manifestYawn.json = manifestObject;

        if (opts) {
          this.realFs.writeFileSync(
            npath.fromPortablePath(nativeManifestPath),
            manifestYawn.yaml,
            opts as fs.WriteFileOptions
          );
        } else {
          this.realFs.writeFileSync(
            npath.fromPortablePath(nativeManifestPath),
            manifestYawn.yaml
          );
        }

        return true;
      } catch {
        // errs are ignored, we'll pass this off to the normal file handler
        // to try and write a package.json
      }
    }

    return false;
  }
  // if (p.toString().endsWith(`package.json`)) {
  //   const pkgJsonExists = this.realFs.existsSync(
  //     npath.fromPortablePath(p.toString())
  //   );

  //   // if theres no package.json where it should be
  //   // we'll check and see if theres a package.yaml/yml and write that
  //   // if none is found, we'll fall through to the bottom of this whole fn
  //   // and write the file the caller wanted to
  //   if (!pkgJsonExists) {
  //     if (await writeYamlManifest()) {
  //       return;
  //     }
  //   }
  // }

  // // this will probably never be called
  // if (
  //   p.toString().endsWith(`package.yml`) ||
  //   p.toString().endsWith(`package.yaml`)
  // ) {
  //   if (await writeYamlManifest()) {
  //     return;
  //   }
  // }

  // FS

  getExtractHint() {
    return false;
  }

  getRealPath() {
    return PortablePath.root;
  }

  resolve(p: PortablePath) {
    p = this.patchManifestPath(p);

    return ppath.resolve(p);
  }

  async openPromise(p: PortablePath, flags: string, mode?: number) {
    p = this.patchManifestPath(p);

    return await new Promise<number>((resolve, reject) => {
      this.realFs.open(
        npath.fromPortablePath(p),
        flags,
        mode,
        this.makeCallback(resolve, reject)
      );
    });
  }

  openSync(p: PortablePath, flags: string, mode?: number) {
    p = this.patchManifestPath(p);

    return this.realFs.openSync(npath.fromPortablePath(p), flags, mode);
  }

  async opendirPromise(
    p: PortablePath,
    opts?: OpendirOptions
  ): Promise<Dir<PortablePath>> {
    return await new Promise<Dir<PortablePath>>((resolve, reject) => {
      if (typeof opts !== `undefined`) {
        this.realFs.opendir(
          npath.fromPortablePath(p),
          opts,
          this.makeCallback(resolve, reject) as any
        );
      } else {
        this.realFs.opendir(
          npath.fromPortablePath(p),
          this.makeCallback(resolve, reject) as any
        );
      }
    }).then((dir) => {
      return Object.defineProperty(dir, `path`, {
        value: p,
        configurable: true,
        writable: true,
      });
    });
  }

  opendirSync(p: PortablePath, opts?: OpendirOptions) {
    const dir =
      typeof opts !== `undefined`
        ? (this.realFs.opendirSync(
            npath.fromPortablePath(p),
            opts
          ) as Dir<PortablePath>)
        : (this.realFs.opendirSync(
            npath.fromPortablePath(p)
          ) as Dir<PortablePath>);

    return Object.defineProperty(dir, `path`, {
      value: p,
      configurable: true,
      writable: true,
    });
  }

  async readPromise(
    fd: number,
    buffer: Buffer,
    offset = 0,
    length = 0,
    position: number | null = -1
  ) {
    return await new Promise<number>((resolve, reject) => {
      this.realFs.read(
        fd,
        buffer,
        offset,
        length,
        position,
        (error, bytesRead) => {
          if (error) {
            reject(error);
          } else {
            resolve(bytesRead);
          }
        }
      );
    });
  }

  readSync(
    fd: number,
    buffer: Buffer,
    offset: number,
    length: number,
    position: number
  ) {
    return this.realFs.readSync(fd, buffer, offset, length, position);
  }

  writePromise(
    fd: number,
    buffer: Buffer,
    offset?: number,
    length?: number,
    position?: number
  ): Promise<number>;

  writePromise(fd: number, buffer: string, position?: number): Promise<number>;

  async writePromise(
    fd: number,
    buffer: Buffer | string,
    offset?: number,
    length?: number,
    position?: number
  ): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
      if (typeof buffer === `string`) {
        return this.realFs.write(
          fd,
          buffer,
          offset,
          this.makeCallback(resolve, reject)
        );
      } else {
        return this.realFs.write(
          fd,
          buffer,
          offset,
          length,
          position,
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  writeSync(
    fd: number,
    buffer: Buffer,
    offset?: number,
    length?: number,
    position?: number
  ): number;

  writeSync(fd: number, buffer: string, position?: number): number;

  writeSync(
    fd: number,
    buffer: Buffer | string,
    offset?: number,
    length?: number,
    position?: number
  ) {
    if (typeof buffer === `string`) {
      return this.realFs.writeSync(fd, buffer, offset);
    } else {
      return this.realFs.writeSync(fd, buffer, offset, length, position);
    }
  }

  async closePromise(fd: number) {
    await new Promise<void>((resolve, reject) => {
      this.realFs.close(fd, this.makeCallback(resolve, reject));
    });
  }

  closeSync(fd: number) {
    this.realFs.closeSync(fd);
  }

  createReadStream(p: PortablePath | null, opts?: CreateReadStreamOptions) {
    if (p !== null) {
      p = this.patchManifestPath(p);
    }

    const realPath = (
      p !== null ? npath.fromPortablePath(p) : p
    ) as fs.PathLike;

    return this.realFs.createReadStream(
      realPath,
      opts as BufferEncoding | undefined
    );
  }

  createWriteStream(p: PortablePath | null, opts?: CreateWriteStreamOptions) {
    if (p !== null) {
      p = this.patchManifestPath(p);
    }

    const realPath = (
      p !== null ? npath.fromPortablePath(p) : p
    ) as fs.PathLike;

    return this.realFs.createWriteStream(
      realPath,
      opts as BufferEncoding | undefined
    );
  }

  async realpathPromise(p: PortablePath) {
    p = this.patchManifestPath(p);

    return await new Promise<string>((resolve, reject) => {
      this.realFs.realpath(
        npath.fromPortablePath(p),
        {},
        this.makeCallback(resolve, reject)
      );
    }).then((path) => {
      return npath.toPortablePath(path);
    });
  }

  realpathSync(p: PortablePath) {
    p = this.patchManifestPath(p);

    return npath.toPortablePath(
      this.realFs.realpathSync(npath.fromPortablePath(p), {})
    );
  }

  async existsPromise(p: PortablePath) {
    p = this.patchManifestPath(p);

    return await new Promise<boolean>((resolve) => {
      if (this.realFs.existsSync(npath.fromPortablePath(p))) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  accessSync(p: PortablePath, mode?: number) {
    p = this.patchManifestPath(p);

    return this.realFs.accessSync(npath.fromPortablePath(p), mode);
  }

  async accessPromise(p: PortablePath, mode?: number) {
    p = this.patchManifestPath(p);

    return await new Promise<void>((resolve, reject) => {
      this.realFs.access(
        npath.fromPortablePath(p),
        mode,
        this.makeCallback(resolve, reject)
      );
    });
  }

  existsSync(p: PortablePath) {
    p = this.patchManifestPath(p);

    return this.realFs.existsSync(npath.fromPortablePath(p));
  }

  async statPromise(p: PortablePath): Promise<Stats>;

  // @ts-expect-error unknown
  async statPromise(
    p: PortablePath,
    opts: { bigint: true }
  ): Promise<BigIntStats>;

  async statPromise(
    p: PortablePath,
    opts?: { bigint: boolean }
  ): Promise<BigIntStats | Stats>;

  async statPromise(p: PortablePath, opts?: { bigint: boolean }) {
    return await new Promise<Stats>((resolve, reject) => {
      p = this.patchManifestPath(p);

      if (opts) {
        this.realFs.stat(
          npath.fromPortablePath(p),
          opts as fs.StatOptions & { bigint?: false | undefined },
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.stat(
          npath.fromPortablePath(p),
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  statSync(p: PortablePath): Stats;

  statSync(p: PortablePath, opts: { bigint: true }): BigIntStats;

  statSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats;

  statSync(p: PortablePath, opts?: { bigint: boolean }) {
    p = this.patchManifestPath(p);

    if (opts) {
      return this.realFs.statSync(npath.fromPortablePath(p), opts);
    } else {
      return this.realFs.statSync(npath.fromPortablePath(p));
    }
  }

  async fstatPromise(fd: number): Promise<Stats>;

  // @ts-expect-error unknown
  async fstatPromise(fd: number, opts: { bigint: true }): Promise<BigIntStats>;

  async fstatPromise(
    fd: number,
    opts?: { bigint: boolean }
  ): Promise<BigIntStats | Stats>;

  async fstatPromise(fd: number, opts?: { bigint: boolean }) {
    return await new Promise<Stats>((resolve, reject) => {
      if (opts) {
        // @ts-expect-error - The node typings doesn't know about the options
        this.realFs.fstat(fd, opts, this.makeCallback(resolve, reject));
      } else {
        this.realFs.fstat(fd, this.makeCallback(resolve, reject));
      }
    });
  }

  fstatSync(fd: number): Stats;

  fstatSync(fd: number, opts: { bigint: true }): BigIntStats;

  fstatSync(fd: number, opts?: { bigint: boolean }): BigIntStats | Stats;

  fstatSync(fd: number, opts?: { bigint: boolean }) {
    if (opts) {
      return this.realFs.fstatSync(fd, opts);
    } else {
      return this.realFs.fstatSync(fd);
    }
  }

  async lstatPromise(p: PortablePath): Promise<Stats>;

  // @ts-expect-error unknown
  async lstatPromise(
    p: PortablePath,
    opts: { bigint: true }
  ): Promise<BigIntStats>;

  async lstatPromise(
    p: PortablePath,
    opts?: { bigint: boolean }
  ): Promise<BigIntStats | Stats>;

  async lstatPromise(p: PortablePath, opts?: { bigint: boolean }) {
    return await new Promise<Stats>((resolve, reject) => {
      p = this.patchManifestPath(p);

      if (opts) {
        // @ts-expect-error - TS does not know this takes options
        this.realFs.lstat(
          npath.fromPortablePath(p),
          opts,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.lstat(
          npath.fromPortablePath(p),
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  lstatSync(p: PortablePath): Stats;

  lstatSync(p: PortablePath, opts: { bigint: true }): BigIntStats;

  lstatSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats;

  lstatSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats {
    p = this.patchManifestPath(p);

    if (opts) {
      return this.realFs.lstatSync(npath.fromPortablePath(p), opts);
    } else {
      return this.realFs.lstatSync(npath.fromPortablePath(p));
    }
  }

  async chmodPromise(p: PortablePath, mask: number) {
    return await new Promise<void>((resolve, reject) => {
      p = this.patchManifestPath(p);

      this.realFs.chmod(
        npath.fromPortablePath(p),
        mask,
        this.makeCallback(resolve, reject)
      );
    });
  }

  chmodSync(p: PortablePath, mask: number) {
    p = this.patchManifestPath(p);

    return this.realFs.chmodSync(npath.fromPortablePath(p), mask);
  }

  async chownPromise(p: PortablePath, uid: number, gid: number) {
    return await new Promise<void>((resolve, reject) => {
      p = this.patchManifestPath(p);

      this.realFs.chown(
        npath.fromPortablePath(p),
        uid,
        gid,
        this.makeCallback(resolve, reject)
      );
    });
  }

  chownSync(p: PortablePath, uid: number, gid: number) {
    p = this.patchManifestPath(p);

    return this.realFs.chownSync(npath.fromPortablePath(p), uid, gid);
  }

  async renamePromise(oldP: PortablePath, newP: PortablePath) {
    this.cache.delete(oldP);
    this.cache.delete(newP);

    return await new Promise<void>((resolve, reject) => {
      this.realFs.rename(
        npath.fromPortablePath(oldP),
        npath.fromPortablePath(newP),
        this.makeCallback(resolve, reject)
      );
    });
  }

  renameSync(oldP: PortablePath, newP: PortablePath) {
    this.cache.delete(oldP);
    this.cache.delete(newP);

    return this.realFs.renameSync(
      npath.fromPortablePath(oldP),
      npath.fromPortablePath(newP)
    );
  }

  async copyFilePromise(sourceP: PortablePath, destP: PortablePath, flags = 0) {
    //  TODO: do we need to patch this?
    return await new Promise<void>((resolve, reject) => {
      this.realFs.copyFile(
        npath.fromPortablePath(sourceP),
        npath.fromPortablePath(destP),
        flags,
        this.makeCallback(resolve, reject)
      );
    });
  }

  copyFileSync(sourceP: PortablePath, destP: PortablePath, flags = 0) {
    this.cache.delete(sourceP);
    this.cache.delete(destP);

    return this.realFs.copyFileSync(
      npath.fromPortablePath(sourceP),
      npath.fromPortablePath(destP),
      flags
    );
  }

  async appendFilePromise(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    p = this.patchManifestPath(p as PortablePath);

    return await new Promise<void>((resolve, reject) => {
      const fsNativePath =
        typeof p === `string` ? npath.fromPortablePath(p) : p;

      if (opts) {
        this.realFs.appendFile(
          fsNativePath,
          content as string | Uint8Array,
          opts as fs.WriteFileOptions,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.appendFile(
          fsNativePath,
          content as string | Uint8Array,
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  // Not patched, if you tried to append to package.json and it was yaml,
  // it wouldn't be great.
  appendFileSync(
    p: PortablePath,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    if (opts) {
      this.realFs.appendFileSync(
        fsNativePath,
        content as string | Uint8Array,
        opts as fs.WriteFileOptions
      );
    } else {
      this.realFs.appendFileSync(fsNativePath, content as string | Uint8Array);
    }
  }

  async writeFilePromise(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    await new Promise<void>((resolve, reject) => {
      p = this.patchManifestPath(p as PortablePath);
      const m = this.isPathForManifest(p);

      if (m !== false) {
        const success = this.writeManifestFile(p, content, m, opts);

        if (success) {
          resolve();

          return;
        }
      }

      const fsNativePath =
        typeof p === `string` ? npath.fromPortablePath(p) : p;

      if (opts) {
        this.realFs.writeFile(
          fsNativePath,
          content as string | NodeJS.ArrayBufferView,
          opts as fs.WriteFileOptions,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.writeFile(
          fsNativePath,
          content as string | NodeJS.ArrayBufferView,
          this.makeCallback(resolve, reject)
        );
      }
    });

    return;
  }

  writeFileSync(
    p: PortablePath,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    p = this.patchManifestPath(p as PortablePath);
    const m = this.isPathForManifest(p);

    if (m !== false) {
      const success = this.writeManifestFile(p, content, m, opts);

      if (success) {
        return;
      }
    }

    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    if (opts) {
      return this.realFs.writeFileSync(
        fsNativePath,
        content as string | NodeJS.ArrayBufferView,
        opts as fs.WriteFileOptions
      );
    } else {
      return this.realFs.writeFileSync(
        fsNativePath,
        content as string | NodeJS.ArrayBufferView
      );
    }
  }

  async unlinkPromise(p: PortablePath) {
    p = this.patchManifestPath(p);

    return await new Promise<void>((resolve, reject) => {
      this.realFs.unlink(
        npath.fromPortablePath(p),
        this.makeCallback(resolve, reject)
      );
    });
  }

  unlinkSync(p: PortablePath) {
    p = this.patchManifestPath(p);

    return this.realFs.unlinkSync(npath.fromPortablePath(p));
  }

  async utimesPromise(
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    return await new Promise<void>((resolve, reject) => {
      p = this.patchManifestPath(p);

      this.realFs.utimes(
        npath.fromPortablePath(p),
        atime,
        mtime,
        this.makeCallback(resolve, reject)
      );
    });
  }

  utimesSync(
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    p = this.patchManifestPath(p);

    this.realFs.utimesSync(npath.fromPortablePath(p), atime, mtime);
  }

  async mkdirPromise(p: PortablePath, opts?: MkdirOptions) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.mkdir(
        npath.fromPortablePath(p) as fs.PathLike,
        opts as
          | fs.Mode
          | (fs.MakeDirectoryOptions & { recursive?: false | undefined }),
        this.makeCallback(resolve, reject)
      );
    });
  }

  mkdirSync(p: PortablePath, opts?: MkdirOptions) {
    return this.realFs.mkdirSync(npath.fromPortablePath(p), opts);
  }

  async rmdirPromise(p: PortablePath, opts?: RmdirOptions) {
    this.cache.delete(p);

    return await new Promise<void>((resolve, reject) => {
      // TODO: always pass opts when min node version is 12.10+
      if (opts) {
        this.realFs.rmdir(
          npath.fromPortablePath(p),
          opts,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.rmdir(
          npath.fromPortablePath(p),
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  rmdirSync(p: PortablePath, opts?: RmdirOptions) {
    this.cache.delete(p);

    return this.realFs.rmdirSync(npath.fromPortablePath(p), opts);
  }

  async linkPromise(existingP: PortablePath, newP: PortablePath) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.link(
        npath.fromPortablePath(existingP),
        npath.fromPortablePath(newP),
        this.makeCallback(resolve, reject)
      );
    });
  }

  linkSync(existingP: PortablePath, newP: PortablePath) {
    return this.realFs.linkSync(
      npath.fromPortablePath(existingP),
      npath.fromPortablePath(newP)
    );
  }

  async symlinkPromise(
    target: PortablePath,
    p: PortablePath,
    type?: SymlinkType
  ) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.symlink(
        npath.fromPortablePath(target.replace(/\/+$/, ``) as PortablePath),
        npath.fromPortablePath(p),
        type,
        this.makeCallback(resolve, reject)
      );
    });
  }

  symlinkSync(target: PortablePath, p: PortablePath, type?: SymlinkType) {
    return this.realFs.symlinkSync(
      npath.fromPortablePath(target.replace(/\/+$/, ``) as PortablePath),
      npath.fromPortablePath(p),
      type
    );
  }

  readFilePromise(p: FSPath<PortablePath>, encoding: "utf8"): Promise<string>;

  readFilePromise(p: FSPath<PortablePath>, encoding?: string): Promise<Buffer>;

  // TODO: extract this
  async readFilePromise(p: FSPath<PortablePath>, encoding?: string) {
    return await new Promise<any>((resolve, reject) => {
      p = this.patchManifestPath(p as PortablePath);

      if (this.isPathForManifest(p)) {
        const manifest = this.readManifestFile(p, encoding);

        if (manifest !== false) {
          resolve(manifest);
        }
      }

      const fsNativePath =
        typeof p === `string` ? npath.fromPortablePath(p) : p;

      this.realFs.readFile(
        fsNativePath,
        encoding,
        this.makeCallback(resolve, reject)
      );
    });
  }

  readFileSync(p: FSPath<PortablePath>, encoding: "utf8"): string;

  readFileSync(p: FSPath<PortablePath>, encoding?: string): Buffer;

  // TODO: patch this and load the yaml
  readFileSync(p: FSPath<PortablePath>, encoding?: string) {
    p = this.patchManifestPath(p as PortablePath);

    if (this.isPathForManifest(p)) {
      const manifest = this.readManifestFile(p, encoding);

      if (manifest !== false) {
        return manifest;
      }
    }

    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    return this.realFs.readFileSync(
      fsNativePath,
      encoding as
        | BufferEncoding
        | (fs.BaseEncodingOptions & { flag?: string | undefined })
        | null
        | undefined
    );
  }

  async readdirPromise(p: PortablePath): Promise<Array<Filename>>;

  async readdirPromise(
    p: PortablePath,
    opts: { withFileTypes: false }
  ): Promise<Array<Filename>>;

  async readdirPromise(
    p: PortablePath,
    opts: { withFileTypes: true }
  ): Promise<Array<Dirent>>;

  async readdirPromise(
    p: PortablePath,
    opts: { withFileTypes: boolean }
  ): Promise<Array<Filename> | Array<Dirent>>;

  // TODO: patch this?
  async readdirPromise(
    p: PortablePath,
    { withFileTypes }: { withFileTypes?: boolean } = {}
  ): Promise<Array<string> | Array<Dirent>> {
    return await new Promise<Array<Filename> | Array<Dirent>>(
      (resolve, reject) => {
        if (withFileTypes) {
          this.realFs.readdir(
            npath.fromPortablePath(p),
            { withFileTypes: true },
            this.makeCallback(resolve, reject) as any
          );
        } else {
          this.realFs.readdir(
            npath.fromPortablePath(p),
            this.makeCallback(
              (value) => resolve(value as Array<Filename>),
              reject
            )
          );
        }
      }
    );
  }

  readdirSync(p: PortablePath): Array<Filename>;

  readdirSync(p: PortablePath, opts: { withFileTypes: false }): Array<Filename>;

  readdirSync(p: PortablePath, opts: { withFileTypes: true }): Array<Dirent>;

  readdirSync(
    p: PortablePath,
    opts: { withFileTypes: boolean }
  ): Array<Filename> | Array<Dirent>;

  // TODO: patch this?
  readdirSync(
    p: PortablePath,
    { withFileTypes }: { withFileTypes?: boolean } = {}
  ): Array<string> | Array<Dirent> {
    if (withFileTypes) {
      return this.realFs.readdirSync(npath.fromPortablePath(p), {
        withFileTypes: true,
      } as any);
    } else {
      return this.realFs.readdirSync(
        npath.fromPortablePath(p)
      ) as Array<Filename>;
    }
  }

  async readlinkPromise(p: PortablePath) {
    return await new Promise<string>((resolve, reject) => {
      this.realFs.readlink(
        npath.fromPortablePath(p),
        this.makeCallback(resolve, reject)
      );
    }).then((path) => {
      return npath.toPortablePath(path);
    });
  }

  readlinkSync(p: PortablePath) {
    return npath.toPortablePath(
      this.realFs.readlinkSync(npath.fromPortablePath(p))
    );
  }

  async truncatePromise(p: PortablePath, len?: number) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.truncate(
        npath.fromPortablePath(p),
        len,
        this.makeCallback(resolve, reject)
      );
    });
  }

  truncateSync(p: PortablePath, len?: number) {
    return this.realFs.truncateSync(npath.fromPortablePath(p), len);
  }

  watch(p: PortablePath, cb?: WatchCallback): Watcher;

  watch(p: PortablePath, opts: WatchOptions, cb?: WatchCallback): Watcher;

  watch(p: PortablePath, a?: WatchOptions | WatchCallback, b?: WatchCallback) {
    p = this.patchManifestPath(p);

    return this.realFs.watch(
      npath.fromPortablePath(p),
      // @ts-expect-error undefined
      a,
      b
    );
  }

  watchFile(p: PortablePath, cb: WatchFileCallback): StatWatcher;

  watchFile(
    p: PortablePath,
    opts: WatchFileOptions,
    cb: WatchFileCallback
  ): StatWatcher;

  watchFile(
    p: PortablePath,
    a: WatchFileOptions | WatchFileCallback,
    b?: WatchFileCallback
  ) {
    p = this.patchManifestPath(p);

    return this.realFs.watchFile(
      npath.fromPortablePath(p),
      // @ts-expect-error undefined
      a,
      b
    ) as unknown as StatWatcher;
  }

  unwatchFile(p: PortablePath, cb?: WatchFileCallback) {
    p = this.patchManifestPath(p);

    return this.realFs.unwatchFile(npath.fromPortablePath(p), cb);
  }

  private makeCallback<T>(
    resolve: (value: T) => void,
    reject: (reject: NodeJS.ErrnoException) => void
  ) {
    return (err: NodeJS.ErrnoException | null, result: T) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    };
  }
}
