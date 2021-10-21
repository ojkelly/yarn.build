import { Filename } from "@yarnpkg/fslib";
import { getIgnoreFile } from "./getIgnoreFile";
import { getIgnoreFilePath } from "./getIgnoreFilePath";
import ignore from "ignore";
import { getAllFiles } from "./getAllFiles";
interface GetExcludedFilesProps {
  ignoreFile: Filename;
  exclude: string[];
  cwd: string;
}

export const getExcludedFiles = async ({
  exclude,
  ignoreFile: _ignoreFile,
  cwd,
}: GetExcludedFilesProps): Promise<Filename[]> => {
  const ignoreFile = getIgnoreFilePath({ ignoreFile: _ignoreFile, cwd });

  const ignores = ignore().add([
    ...exclude,
    ...(await getIgnoreFile(ignoreFile)),
  ]);
  const allFiles = await getAllFiles({ cwd });
  const removeFiles = allFiles
    .filter((fileName) => ignores.ignores(fileName))
    .map((fileName) => `${cwd}/${fileName}`);

  return removeFiles as Filename[];
};
