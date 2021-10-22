import { resolveUserDirectory } from "../bundle";

describe("resolveUserDirectory", () => {
  const cases = [
    ["C:\\foo\\bar", "/C:/foo/bar"],
    ["/root/dir", "/root/dir"],
  ];

  test.each(cases)("%s => %s", (given, expected) => {
    const result = resolveUserDirectory(given);

    expect(result).toEqual(expected);
  });
});
