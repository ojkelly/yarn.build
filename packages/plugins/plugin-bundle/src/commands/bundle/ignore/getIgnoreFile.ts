import { Filename } from "@yarnpkg/fslib";
import { readFileSync } from "fs";

export const getIgnoreFile = async (fileName: Filename): Promise<string[]> => {
  try {
    const data = readFileSync(fileName, "utf-8");

    return data.split("\n");
  } catch (_e) {
    // File does not exist.
    return [];
  }
};
