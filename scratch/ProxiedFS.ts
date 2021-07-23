/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  CreateReadStreamOptions,
  CreateWriteStreamOptions,
} from "@yarnpkg/fslib";
import { NodeFS, FakeFS, WriteFileOptions, ProxiedFS } from "@yarnpkg/fslib";
import { WatchOptions, WatchCallback, Watcher } from "@yarnpkg/fslib";
import { FSPath, NativePath, PortablePath, npath, ppath } from "@yarnpkg/fslib";
import { RmdirOptions } from "@yarnpkg/fslib";
import {
  Dirent,
  Filename,
  MkdirOptions,
  ExtractHintOptions,
  WatchFileCallback,
  WatchFileOptions,
  StatWatcher,
  OpendirOptions,
  Dir,
} from "@yarnpkg/fslib";
import { PnpApi } from "@yarnpkg/pnp";
import fs, { BigIntStats, Stats } from "fs";

import { WatchManager } from "@yarnpkg/pnpify/lib/WatchManager";
import { buildNodeModulesTree } from "@yarnpkg/pnpify/lib/buildNodeModulesTree";
import {
  NodeModulesTreeOptions,
  NodeModulesTree,
} from "@yarnpkg/pnpify/lib/buildNodeModulesTree";

export class PackageYamlFS extends ProxiedFS<NativePath, PortablePath> {
  protected readonly baseFs: FakeFS<PortablePath>;

  constructor(realFs?: typeof fs) {
    super(npath);

    this.baseFs = new PortableNodeModulesFS(pnp, {
      baseFs: new NodeFS(realFs),
      pnpifyFs,
    });
  }

  protected mapFromBase(path: PortablePath) {
    return npath.fromPortablePath(path);
  }

  protected mapToBase(path: NativePath) {
    return npath.toPortablePath(path);
  }
}

export abstract class BasePortableFakeFS extends FakeFS<PortablePath> {
  protected constructor() {
    super(ppath);
  }
}

export class PortableNodeModulesFS extends BasePortableFakeFS {
  private readonly realFs: typeof fs;

  protected readonly baseFs: FakeFS<PortablePath>;

  constructor(realFs: typeof fs = fs) {
    super();

    this.realFs = realFs;
  }

  getExtractHint(hints: ExtractHintOptions) {
    return this.baseFs.getExtractHint(hints);
  }

  resolve(path: PortablePath) {
    return this.baseFs.resolve(path);
  }

  getBaseFs() {
    return this.baseFs;
  }

  private resolveFilePath(p: PortablePath): PortablePath;

  private resolveFilePath(p: FSPath<PortablePath>): FSPath<PortablePath>;

  private resolveFilePath(p: FSPath<PortablePath>): FSPath<PortablePath> {
    return p;
  }

  // private resolveDirOrFilePath(p: PortablePath): PortablePath;

  // private resolveDirOrFilePath(p: FSPath<PortablePath>): FSPath<PortablePath>;

  // private resolveDirOrFilePath(p: FSPath<PortablePath>): FSPath<PortablePath> {
  //   return this.baseFs.resolveDirOrFilePath(p);
  // }

  getRealPath() {
    return this.baseFs.getRealPath();
  }

  async openPromise(p: PortablePath, flags: string, mode?: number) {
    return await this.baseFs.openPromise(this.resolveFilePath(p), flags, mode);
  }

  openSync(p: PortablePath, flags: string, mode?: number) {
    return this.baseFs.openSync(this.resolveFilePath(p), flags, mode);
  }

  async opendirPromise(
    p: PortablePath,
    opts?: OpendirOptions
  ): Promise<Dir<PortablePath>> {
    return await this.baseFs.opendirPromise(p, opts);
  }

  opendirSync(p: PortablePath, opts?: OpendirOptions): Dir<PortablePath> {
    return this.baseFs.opendirSync(p, opts);
  }

  async readPromise(
    fd: number,
    buffer: Buffer,
    offset?: number,
    length?: number,
    position?: number
  ) {
    return await this.baseFs.readPromise(fd, buffer, offset, length, position);
  }

  readSync(
    fd: number,
    buffer: Buffer,
    offset?: number,
    length?: number,
    position?: number
  ) {
    return this.baseFs.readSync(fd, buffer, offset, length, position);
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
    if (typeof buffer === `string`) {
      return await this.baseFs.writePromise(fd, buffer, offset);
    } else {
      return await this.baseFs.writePromise(
        fd,
        buffer,
        offset,
        length,
        position
      );
    }
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
      return this.baseFs.writeSync(fd, buffer, offset);
    } else {
      return this.baseFs.writeSync(fd, buffer, offset, length, position);
    }
  }

  async closePromise(fd: number) {
    await this.baseFs.closePromise(fd);
  }

  closeSync(fd: number) {
    this.baseFs.closeSync(fd);
  }

  createReadStream(p: PortablePath | null, opts?: CreateReadStreamOptions) {
    return this.baseFs.createReadStream(
      p !== null ? this.resolveFilePath(p) : p,
      opts
    );
  }

  createWriteStream(p: PortablePath | null, opts?: CreateWriteStreamOptions) {
    return this.baseFs.createWriteStream(p !== null ? p : p, opts);
  }

  async realpathPromise(p: PortablePath) {
    return this.baseFs.realpathPromise(p);
  }

  realpathSync(p: PortablePath) {
    return this.baseFs.realpathSync(p);
  }

  async existsPromise(p: PortablePath) {
    return await this.baseFs.existsPromise(p);
  }

  existsSync(p: PortablePath) {
    return this.baseFs.existsSync(p);
  }

  async accessPromise(p: PortablePath, mode?: number) {
    return await this.baseFs.accessPromise(p, mode);
  }

  accessSync(p: PortablePath, mode?: number) {
    return this.baseFs.accessSync(p, mode);
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
    return await this.baseFs.statPromise(p, opts);
  }

  statSync(p: PortablePath): Stats;

  statSync(p: PortablePath, opts: { bigint: true }): BigIntStats;

  statSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats;

  statSync(p: PortablePath, opts?: { bigint: boolean }) {
    return this.baseFs.statSync(p, opts);
  }

  async fstatPromise(fd: number): Promise<Stats>;

  async fstatPromise(fd: number, opts: { bigint: true }): Promise<BigIntStats>;

  async fstatPromise(
    fd: number,
    opts?: { bigint: boolean }
  ): Promise<BigIntStats | Stats>;

  async fstatPromise(fd: number, opts?: { bigint: boolean }) {
    return await this.baseFs.fstatPromise(fd, opts);
  }

  fstatSync(fd: number): Stats;

  fstatSync(fd: number, opts: { bigint: true }): BigIntStats;

  fstatSync(fd: number, opts?: { bigint: boolean }): BigIntStats | Stats;

  fstatSync(fd: number, opts?: { bigint: boolean }) {
    return this.baseFs.fstatSync(fd, opts);
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
    return await this.baseFs.lstatPromise(p, opts);
  }

  lstatSync(p: PortablePath): Stats;

  lstatSync(p: PortablePath, opts: { bigint: true }): BigIntStats;

  lstatSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats;

  lstatSync(p: PortablePath, opts?: { bigint: boolean }): BigIntStats | Stats {
    return this.baseFs.lstatSync(p, opts);
  }

  async chmodPromise(p: PortablePath, mask: number) {
    return await this.baseFs.chmodPromise(p, mask);
  }

  chmodSync(p: PortablePath, mask: number) {
    return this.baseFs.chmodSync(p, mask);
  }

  async chownPromise(p: PortablePath, uid: number, gid: number) {
    return await this.baseFs.chownPromise(p, uid, gid);
  }

  chownSync(p: PortablePath, uid: number, gid: number) {
    return this.baseFs.chownSync(p, uid, gid);
  }

  async renamePromise(o: PortablePath, n: PortablePath) {
    return await this.baseFs.renamePromise(o, n);
  }

  renameSync(o: PortablePath, n: PortablePath) {
    return this.baseFs.renameSync(o, n);
  }

  async copyFilePromise(s: PortablePath, d: PortablePath, flags?: number) {
    return await this.baseFs.copyFilePromise(s, d, flags);
  }

  copyFileSync(s: PortablePath, d: PortablePath, flags?: number) {
    return this.baseFs.copyFileSync(s, d, flags);
  }

  async appendFilePromise(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    return await this.baseFs.appendFilePromise(p, content, opts);
  }

  appendFileSync(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    return this.baseFs.appendFileSync(p, content, opts);
  }

  async writeFilePromise(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    return await this.baseFs.writeFilePromise(p, content, opts);
  }

  writeFileSync(
    p: FSPath<PortablePath>,
    content: string | Buffer | ArrayBuffer | DataView,
    opts?: WriteFileOptions
  ) {
    return this.baseFs.writeFileSync(p, content, opts);
  }

  async unlinkPromise(p: PortablePath) {
    return await this.baseFs.unlinkPromise(p);
  }

  unlinkSync(p: PortablePath) {
    return this.baseFs.unlinkSync(p);
  }

  async utimesPromise(
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    return await this.baseFs.utimesPromise(p, atime, mtime);
  }

  utimesSync(
    p: PortablePath,
    atime: Date | string | number,
    mtime: Date | string | number
  ) {
    return this.baseFs.utimesSync(p, atime, mtime);
  }

  async mkdirPromise(p: PortablePath, opts: MkdirOptions) {
    return this.baseFs.mkdirPromise(p, opts);
  }

  mkdirSync(p: PortablePath, opts: MkdirOptions) {
    return this.baseFs.mkdirSync(p, opts);
  }

  async rmdirPromise(p: PortablePath, opts?: RmdirOptions) {
    return await this.baseFs.rmdirPromise(p, opts);
  }

  rmdirSync(p: PortablePath, opts?: RmdirOptions) {
    return this.baseFs.rmdirSync(p, opts);
  }

  async linkPromise(existing: PortablePath, n: PortablePath) {
    return await this.baseFs.linkPromise(existing, n);
  }

  linkSync(existing: PortablePath, n: PortablePath) {
    return this.baseFs.linkSync(existing, n);
  }

  async symlinkPromise(target: PortablePath, p: PortablePath) {
    return await this.baseFs.symlinkPromise(target, p);
  }

  symlinkSync(target: PortablePath, p: PortablePath) {
    return this.baseFs.symlinkSync(target, p);
  }

  readFilePromise(p: FSPath<PortablePath>, encoding: "utf8"): Promise<string>;

  readFilePromise(p: FSPath<PortablePath>, encoding?: string): Promise<Buffer>;

  async readFilePromise(p: FSPath<PortablePath>, encoding?: string) {
    // This weird switch is required to tell TypeScript that the signatures are
    // proper (otherwise it thinks that only the generic one is covered)
    switch (encoding) {
      case `utf8`:
        return await this.baseFs.readFilePromise(
          this.resolveFilePath(p),
          encoding
        );

      default:
        return await this.baseFs.readFilePromise(
          this.resolveFilePath(p),
          encoding
        );
    }
  }

  readFileSync(p: FSPath<PortablePath>, encoding: "utf8"): string;

  readFileSync(p: FSPath<PortablePath>, encoding?: string): Buffer;

  readFileSync(p: FSPath<PortablePath>, encoding?: string) {
    // This weird switch is required to tell TypeScript that the signatures are
    // proper (otherwise it thinks that only the generic one is covered)
    switch (encoding) {
      case `utf8`:
        return this.baseFs.readFileSync(this.resolveFilePath(p), encoding);

      default:
        return this.baseFs.readFileSync(this.resolveFilePath(p), encoding);
    }
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
    return await this.baseFs.readdirPromise(p, {
      withFileTypes: withFileTypes as any,
    });
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
    return this.baseFs.readdirSync(p, {
      withFileTypes: withFileTypes as any,
    });
  }

  async readlinkPromise(p: PortablePath) {
    return this.baseFs.readlinkPromise(p);
  }

  readlinkSync(p: PortablePath) {
    return this.baseFs.readlinkSync(p);
  }

  async truncatePromise(p: PortablePath, len?: number) {
    return await this.baseFs.truncatePromise(p, len);
  }

  truncateSync(p: PortablePath, len?: number) {
    return this.baseFs.truncateSync(p, len);
  }

  watch(p: PortablePath, cb?: WatchCallback): Watcher;

  watch(p: PortablePath, opts: WatchOptions, cb?: WatchCallback): Watcher;

  watch(
    p: PortablePath,
    a?: WatchOptions | WatchCallback,
    b?: WatchCallback
  ): Watcher {
    return this.baseFs.watch(
      p,
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
  ): StatWatcher {
    return this.baseFs.watchFile(
      p,
      // @ts-expect-error undefined
      a,
      b
    );
  }

  unwatchFile(p: PortablePath, cb?: WatchFileCallback) {
    return this.baseFs.unwatchFile(p, cb);
  }
}
