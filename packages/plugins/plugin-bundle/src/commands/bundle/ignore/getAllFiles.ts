import { Filename } from "@yarnpkg/fslib";
import globby from "globby";

interface GetAllFilesProps {
  cwd: string;
}

export const getAllFiles = async ({
  cwd,
}: GetAllFilesProps): Promise<Filename[]> => {
  try {
    const files = (await globby(`**/*`, { dot: true, cwd: cwd, absolute: false })) as Filename[];

    return files;
  } catch (_e) {
    return [];
  }
};
