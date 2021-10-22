import { resolveNativePath } from "../bundle";

describe("resolveNativePath", () => {
  const cases = [
    ["C:\\foo\\bar", "/C:/foo/bar"],
    ["/root/dir", "/root/dir"],
  ];

  test.each(cases)("%s => %s", (given, expected) => {
    const result = resolveNativePath(given);

    expect(result).toEqual(expected);
  });
});
