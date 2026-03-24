export const PackageFiles = ["package.json"] as const;
export type PackageFile = (typeof PackageFiles)[number];
