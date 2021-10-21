export const PackageFiles = [
  "package.json",
  "package.yaml",
  "package.yml",
] as const;
export type PackageFile = typeof PackageFiles[number];
