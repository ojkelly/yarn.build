import { Filename } from "@yarnpkg/fslib";
import { readFile as _readFile } from "fs";
import { promisify } from "util";

const readFile = promisify(_readFile);

export const getIgnoreFile = async (fileName: Filename): Promise<string[]> => {
  try {
    const data = await readFile(fileName, "utf-8");

    return data.split("\n");
  } catch (_e) {
    // File does not exist.
    return [];
  }
};
