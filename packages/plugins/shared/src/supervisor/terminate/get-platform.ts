export const getPlatform = (): "unix" | "windows" => {
  return process.platform === "win32" ? "windows" : "unix";
};
