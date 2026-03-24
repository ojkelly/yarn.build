import { execFile } from "child_process";
import { promisify } from "util";
import { getPlatform } from "./get-platform";

const execFileAsync = promisify(execFile);

export const getAllChildProccess = async (
  pid: number | string,
): Promise<number[]> => {
  const platform = getPlatform();
  let messages: number[] = [];

  try {
    let stdout: string;
    if (platform === "unix") {
      ({ stdout } = await execFileAsync("pgrep", ["-P", String(pid)]));
    } else if (platform === "windows") {
      ({ stdout } = await execFileAsync("wmic", [
        "process",
        "where",
        `(ParentProcessId=${pid})`,
        "get",
        "ProcessId",
      ]));
    } else {
      throw new Error("Unable to find parent process");
    }

    messages = stdout
      .split(`\n`)
      .filter(Boolean)
      .map((value) => parseInt(value, 10))
      .filter((value) => !isNaN(value));
  } catch {
    // Empty on purpose
  }

  return messages;
};
