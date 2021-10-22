const { resolveNativePath } = require('../bundle');
const os = require('os');
const { npath, ppath } = require('@yarnpkg/fslib');

describe("resolveNativePath", () => {
  const testWindows = os.platform().startsWith("win") ? test : test.skip;
  const testNonWindows = !os.platform().startsWith("win") ? test : test.skip;

  testWindows("windows drive letter paths", () => {
    const result = resolveNativePath("C:\\foo\\bar");

    expect(result).toEqual("/C:/foo/bar");
  });

  testWindows("windows relative paths", () => {
    const result = resolveNativePath("foo\\bar");

    const cwd = npath.toPortablePath(process.cwd());
    const subdir = npath.toPortablePath("foo\\bar");

    expect(result).toEqual(ppath.join(cwd, subdir));
  });

  testNonWindows("non-windows relative paths", () => {
    const result = resolveNativePath("path/to/foo");

    const cwd = npath.toPortablePath(process.cwd());
    const subdir = npath.toPortablePath("path/to/foo");

    expect(result).toEqual(ppath.join(cwd, subdir));
  });
});
