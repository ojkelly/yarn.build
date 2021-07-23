/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  FakeFS,
  ppath,
  npath,
  MkdirOptions,
  RmdirOptions,
  WatchOptions,
  WatchCallback,
  Watcher,
  CreateReadStreamOptions,
  CreateWriteStreamOptions,
  Dir,
  StatWatcher,
  WatchFileCallback,
  WatchFileOptions,
  OpendirOptions,
  FSPath,
  PortablePath,
  Filename,
  Dirent,
  SymlinkType,
  WriteFileOptions,
} from "@yarnpkg/fslib";
import { ENOSYS } from "@yarnpkg/fslib/lib/errors";

import { safeLoad, safeDump, JSON_SCHEMA, load, dump } from "js-yaml";
import fs, { BigIntStats, Stats } from "fs";
import YAWN from "yawn-yaml/cjs";

export class PatchedFS extends FakeFS<PortablePath> {
  private readonly realFs: typeof fs;

  constructor(realFs: typeof fs = fs) {
    super(ppath);

    this.realFs = realFs;

    // @ts-expect-error unknown
    if (typeof this.realFs.lutimes !== `undefined`) {
      this.lutimesPromise = this.lutimesPromiseImpl;
      this.lutimesSync = this.lutimesSyncImpl;
    }
  }

  //  fs methods most from NodeFS then adapted

  getExtractHint() {
    return false;
  }

  getRealPath() {
    return PortablePath.root;
  }

  resolve(p: PortablePath) {
    return ppath.resolve(p);
  }

  async openPromise(p: PortablePath, flags: string, mode?: number) {
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
    const realPath = (p !== null
      ? npath.fromPortablePath(p)
      : p) as fs.PathLike;

    return this.realFs.createReadStream(realPath, opts);
  }

  createWriteStream(p: PortablePath | null, opts?: CreateWriteStreamOptions) {
    const realPath = (p !== null
      ? npath.fromPortablePath(p)
      : p) as fs.PathLike;

    return this.realFs.createWriteStream(realPath, opts);
  }

  async realpathPromise(p: PortablePath) {
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
    return npath.toPortablePath(
      this.realFs.realpathSync(npath.fromPortablePath(p), {})
    );
  }

  async existsPromise(p: PortablePath) {
    return await new Promise<boolean>((resolve) => {
      // console.log(`existsPromise`, {p});

      const loadYmlManifest = () => {
        const pkgYmlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yml`;
        const pkgYmlExists = this.realFs.existsSync(
          npath.fromPortablePath(pkgYmlPath)
        );
        // console.log(`existsPromise`, {pkgYmlPath, pkgYmlExists});

        if (pkgYmlExists) resolve(pkgYmlExists);

        const pkgYamlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yaml`;
        const pkgYamlExists = this.realFs.existsSync(
          npath.fromPortablePath(pkgYamlPath)
        );
        // console.log(`existsPromise`, {pkgYamlPath, pkgYamlExists});

        if (pkgYamlExists) {
          resolve(pkgYamlExists);
        }
      };

      if (p.toString().endsWith(`package.json`)) {
        const pkgJsonExists = this.realFs.existsSync(npath.fromPortablePath(p));

        if (pkgJsonExists) {
          resolve(pkgJsonExists);
        } else {
          loadYmlManifest();
        }
      }

      if (
        p.toString().endsWith(`package.yml`) ||
        p.toString().endsWith(`package.yaml`)
      ) {
        loadYmlManifest();

        return;
      }

      this.realFs.exists(npath.fromPortablePath(p), resolve);
    });
  }

  accessSync(p: PortablePath, mode?: number) {
    return this.realFs.accessSync(npath.fromPortablePath(p), mode);
  }

  async accessPromise(p: PortablePath, mode?: number) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.access(
        npath.fromPortablePath(p),
        mode,
        this.makeCallback(resolve, reject)
      );
    });
  }

  existsSync(p: PortablePath) {
    if (p.toString().endsWith(`package.json`)) {
      // console.log(`existsSync`, {p});

      const pkgJsonExists = this.realFs.existsSync(npath.fromPortablePath(p));

      if (pkgJsonExists) return pkgJsonExists;

      const pkgYmlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yml`;
      const pkgYmlExists = this.realFs.existsSync(
        npath.fromPortablePath(pkgYmlPath)
      );
      // console.log(`existsSync`, {pkgYmlPath, pkgYmlExists});

      if (pkgYmlExists) return pkgYmlExists;

      const pkgYamlPath = `${p.substr(0, p.lastIndexOf(`.`))}.yaml`;
      const pkgYamlExists = this.realFs.existsSync(
        npath.fromPortablePath(pkgYamlPath)
      );
      // console.log(`existsSync`, {pkgYamlPath, pkgYamlExists});

      if (pkgYamlExists) {
        return pkgYamlExists;
      }
    }

    return this.realFs.existsSync(npath.fromPortablePath(p));
  }

  async statPromise(p: PortablePath): Promise<Stats>;

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
      if (opts) {
        this.realFs.stat(
          npath.fromPortablePath(p),
          opts,
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
    if (opts) {
      return this.realFs.statSync(npath.fromPortablePath(p), opts);
    } else {
      return this.realFs.statSync(npath.fromPortablePath(p));
    }
  }

  async fstatPromise(fd: number): Promise<Stats>;

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
      // @ts-expect-error - The node typings doesn't know about the options
      return this.realFs.fstatSync(fd, opts);
    } else {
      return this.realFs.fstatSync(fd);
    }
  }

  async lstatPromise(p: PortablePath): Promise<Stats>;

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
    if (opts) {
      // @ts-expect-error - TS does not know this takes options
      return this.realFs.lstatSync(npath.fromPortablePath(p), opts);
    } else {
      return this.realFs.lstatSync(npath.fromPortablePath(p));
    }
  }

  async chmodPromise(p: PortablePath, mask: number) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.chmod(
        npath.fromPortablePath(p),
        mask,
        this.makeCallback(resolve, reject)
      );
    });
  }

  chmodSync(p: PortablePath, mask: number) {
    return this.realFs.chmodSync(npath.fromPortablePath(p), mask);
  }

  async chownPromise(p: PortablePath, uid: number, gid: number) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.chown(
        npath.fromPortablePath(p),
        uid,
        gid,
        this.makeCallback(resolve, reject)
      );
    });
  }

  chownSync(p: PortablePath, uid: number, gid: number) {
    return this.realFs.chownSync(npath.fromPortablePath(p), uid, gid);
  }

  async renamePromise(oldP: PortablePath, newP: PortablePath) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.rename(
        npath.fromPortablePath(oldP),
        npath.fromPortablePath(newP),
        this.makeCallback(resolve, reject)
      );
    });
  }

  renameSync(oldP: PortablePath, newP: PortablePath) {
    return this.realFs.renameSync(
      npath.fromPortablePath(oldP),
      npath.fromPortablePath(newP)
    );
  }

  async copyFilePromise(sourceP: PortablePath, destP: PortablePath, flags = 0) {
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
    return await new Promise<void>((resolve, reject) => {
      const fsNativePath =
        typeof p === `string` ? npath.fromPortablePath(p) : p;

      if (opts) {
        this.realFs.appendFile(
          fsNativePath,
          content,
          opts,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.appendFile(
          fsNativePath,
          content,
          this.makeCallback(resolve, reject)
        );
      }
    });
  }

  appendFileSync(
    p: PortablePath,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    if (opts) {
      this.realFs.appendFileSync(fsNativePath, content, opts);
    } else {
      this.realFs.appendFileSync(fsNativePath, content);
    }
  }

  async writeFilePromise(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    if (typeof content === `string` || Buffer.isBuffer(content)) {
      const writeYamlManifest = async (): Promise<boolean> => {
        let canWrite = false;
        let manifestPath: string | undefined;
        const pathStr = p.toString();
        const pkgYmlPath = `${pathStr.substr(0, pathStr.lastIndexOf(`.`))}.yml`;
        const pkgYmlExists = this.realFs.existsSync(
          npath.fromPortablePath(pkgYmlPath)
        );

        console.log(`writeFilePromise`, { pkgYmlPath, pkgYmlExists });

        if (pkgYmlExists) {
          canWrite = true;
          manifestPath = pkgYmlPath;
        } else {
          const pkgYamlPath = `${pathStr.substr(
            0,
            pathStr.lastIndexOf(`.`)
          )}.yaml`;
          const pkgYamlExists = this.realFs.existsSync(
            npath.fromPortablePath(pkgYamlPath)
          );

          console.log(`writeFilePromise`, { pkgYamlPath, pkgYamlExists });

          if (pkgYamlExists) {
            canWrite = true;
            manifestPath = pkgYmlPath;
          }
        }

        if (canWrite && typeof manifestPath == `string`) {
          const mJsonStr: string = Buffer.isBuffer(content)
            ? content.toString()
            : content;

          console.log(`writeFilePromise`, { mJsonStr });

          const manifestObject = JSON.parse(mJsonStr);

          console.log(`writeFilePromise`, { manifestObject });
          // const manifestJsonStr = safeDump(manifestObject, JSON_SCHEMA);
          // console.log(`writeFilePromise`, {manifestJsonStr});

          const update: Promise<boolean> = new Promise((didSave) => {
            if (manifestPath) {
              const nativeManifestPath = npath.fromPortablePath(manifestPath);

              this.realFs.readFile(
                nativeManifestPath,
                `utf-8`,
                (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
                  if (err) {
                    didSave(false);
                  } else {
                    let rawManifest = ``;

                    if (data instanceof Buffer) rawManifest = data.toString();
                    else rawManifest = data;

                    const pkgYml = load(rawManifest);

                    console.log(`writeFilePromise update`, {
                      pkgYml,
                      rawManifest,
                    });

                    const manifestYawn = new YAWN(rawManifest);

                    manifestYawn.json = manifestObject;

                    console.log(`writeFilePromise yawn`, {
                      myyy: manifestYawn.yaml,
                    });

                    // TODO: load existing file off disk, deep merge to persist comments?

                    if (opts) {
                      this.realFs.writeFile(
                        npath.fromPortablePath(nativeManifestPath),
                        manifestYawn.yaml,
                        opts,
                        (err) => {
                          if (err) {
                            console.log(`writeFilePromise opts did save false`);
                            didSave(false);
                          } else {
                            console.log(`writeFilePromise opts did save true`);

                            didSave(true);
                          }
                        }
                      );
                    } else {
                      this.realFs.writeFile(
                        npath.fromPortablePath(nativeManifestPath),
                        manifestYawn.yaml,
                        (err) => {
                          if (err) {
                            console.log(`writeFilePromise did save false`);

                            didSave(false);
                          } else {
                            console.log(`writeFilePromise did save true`);

                            didSave(true);
                          }
                        }
                      );
                    }
                  }
                }
              );
            } else {
              didSave(false);
            }
          });

          console.log(`writeFilePromise update`, { update });

          if (await update) {
            console.log(`writeFilePromise update done true`);

            return true;
          }
        }

        console.log(`writeFilePromise update false`);

        return false;
      };

      if (p.toString().endsWith(`package.json`)) {
        const pkgJsonExists = this.realFs.existsSync(
          npath.fromPortablePath(p.toString())
        );

        // if theres no package.json where it should be
        // we'll check and see if theres a package.yaml/yml and write that
        // if none is found, we'll fall through to the bottom of this whole fn
        // and write the file the caller wanted to
        if (!pkgJsonExists) {
          if (await writeYamlManifest()) {
            return;
          }
        }
      }

      // this will probably never be called
      if (
        p.toString().endsWith(`package.yml`) ||
        p.toString().endsWith(`package.yaml`)
      ) {
        if (await writeYamlManifest()) {
          return;
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      if (opts) {
        this.realFs.writeFile(
          fsNativePath,
          content,
          opts,
          this.makeCallback(resolve, reject)
        );
      } else {
        this.realFs.writeFile(
          fsNativePath,
          content,
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
    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    if (opts) {
      this.realFs.writeFileSync(fsNativePath, content, opts);
    } else {
      this.realFs.writeFileSync(fsNativePath, content);
    }
  }

  async unlinkPromise(p: PortablePath) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.unlink(
        npath.fromPortablePath(p),
        this.makeCallback(resolve, reject)
      );
    });
  }

  unlinkSync(p: PortablePath) {
    return this.realFs.unlinkSync(npath.fromPortablePath(p));
  }

  async utimesPromise(
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    return await new Promise<void>((resolve, reject) => {
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
    this.realFs.utimesSync(npath.fromPortablePath(p), atime, mtime);
  }

  private async lutimesPromiseImpl(
    this: PatchedFS,
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    // @ts-expect-error: Not yet in DefinitelyTyped
    const lutimes = this.realFs.lutimes;

    if (typeof lutimes === `undefined`)
      throw ENOSYS(`unavailable Node binding`, `lutimes '${p}'`);

    return await new Promise<void>((resolve, reject) => {
      lutimes.call(
        this.realFs,
        npath.fromPortablePath(p),
        atime,
        mtime,
        this.makeCallback(resolve, reject)
      );
    });
  }

  private lutimesSyncImpl(
    this: PatchedFS,
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    // @ts-expect-error: Not yet in DefinitelyTyped
    const lutimesSync = this.realFs.lutimesSync;

    if (typeof lutimesSync === `undefined`)
      throw ENOSYS(`unavailable Node binding`, `lutimes '${p}'`);

    lutimesSync.call(this.realFs, npath.fromPortablePath(p), atime, mtime);
  }

  async mkdirPromise(p: PortablePath, opts?: MkdirOptions) {
    return await new Promise<void>((resolve, reject) => {
      this.realFs.mkdir(
        npath.fromPortablePath(p),
        opts,
        this.makeCallback(resolve, reject)
      );
    });
  }

  mkdirSync(p: PortablePath, opts?: MkdirOptions) {
    return this.realFs.mkdirSync(npath.fromPortablePath(p), opts);
  }

  async rmdirPromise(p: PortablePath, opts?: RmdirOptions) {
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

  async readFilePromise(p: FSPath<PortablePath>, encoding?: string) {
    return await new Promise<any>((resolve, reject) => {
      const loadYmlManifest = (manifestPath: string) => {
        const fsNativePath =
          typeof manifestPath === `string`
            ? npath.fromPortablePath(manifestPath)
            : manifestPath;

        this.realFs.readFile(
          fsNativePath,
          encoding,
          (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
            if (err) {
              reject(err);
            } else {
              let rawManifest = ``;

              if (data instanceof Buffer) rawManifest = data.toString();
              else rawManifest = data;

              const pkgYml = load(rawManifest);

              console.log(`readFilePromise`, { p, pkgYml, rawManifest });

              console.trace();
              // convert it back to json for compatibility
              resolve(JSON.stringify(pkgYml));
            }
          }
        );
      };

      if (
        p.toString().endsWith(`package.json`) ||
        p.toString().endsWith(`package.yml`) ||
        p.toString().endsWith(`package.yaml`)
      ) {
        // console.log(`readFilePromise`, {p});

        const pth = p.toString();

        const pkgJsonPath = `${pth.substr(0, pth.lastIndexOf(`.`))}.json`;
        const pkgJsonExists = this.realFs.existsSync(
          npath.fromPortablePath(pkgJsonPath)
        );

        // console.log(`readFilePromise`, {pkgJsonPath, pkgJsonExists});

        if (!pkgJsonExists) {
          const pkgYmlPath = `${pth.substr(0, pth.lastIndexOf(`.`))}.yml`;
          const pkgYmlExists = this.realFs.existsSync(
            npath.fromPortablePath(pkgYmlPath)
          );

          // console.log(`readFilePromise`, {pkgYmlPath, pkgYmlExists});

          if (pkgYmlExists) {
            loadYmlManifest(pkgYmlPath);

            return;
          }

          const pkgYamlPath = `${pth.substr(0, pth.lastIndexOf(`.`))}.yaml`;
          const pkgYamlExists = this.realFs.existsSync(
            npath.fromPortablePath(pkgYamlPath)
          );
          // console.log(`readFilePromise`, {pkgYamlPath, pkgYamlExists});

          if (pkgYamlExists) loadYmlManifest(pkgYamlPath);

          return;
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

  readFileSync(p: FSPath<PortablePath>, encoding?: string) {
    // console.log(`readFileSync`, {p});

    const fsNativePath = typeof p === `string` ? npath.fromPortablePath(p) : p;

    return this.realFs.readFileSync(fsNativePath, encoding);
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
    return this.realFs.watch(
      npath.fromPortablePath(p),
      // @ts-expect-error unknown
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
    return (this.realFs.watchFile(
      npath.fromPortablePath(p),
      // @ts-expect-error unknown
      a,
      b
    ) as unknown) as StatWatcher;
  }

  unwatchFile(p: PortablePath, cb?: WatchFileCallback) {
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
