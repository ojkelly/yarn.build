import { resolveNativePath } from "../bundle";
import * as os from "os";
import { npath, ppath } from "@yarnpkg/fslib";

describe("resolveNativePath", () => {
  const testWindows = os.platform().startsWith("win") ? test : test.skip;
  const testNonWindows = !os.platform().startsWith("win") ? test : test.skip;

  testWindows("windows drive letter paths", () => {
    const result = resolveNativePath("C:\\foo\\bar");

    expect(result).toEqual("/C:/foo/bar");
  });

  testNonWindows("non-windows relative paths", () => {
    const result = resolveNativePath("path/to/foo");

    const cwd = npath.toPortablePath(process.cwd());
    const subdir = npath.toPortablePath("path/to/foo");

    expect(result).toEqual(ppath.join(cwd, subdir));
  });
});
