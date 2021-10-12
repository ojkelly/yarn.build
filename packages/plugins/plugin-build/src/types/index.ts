export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown>
    ? DeepPartial<T[P]>
    : T[P];
};
export type Maybe<T> = T | null | undefined;
export const PackageFiles = [
  "package.json",
  "package.yaml",
  "package.yml",
] as const;
export type PackageFile = typeof PackageFiles[number];
