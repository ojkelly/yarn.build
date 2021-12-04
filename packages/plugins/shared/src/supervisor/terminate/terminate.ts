import { getAllChildProccess } from "./get-all-child-process";

export const terminateProcess = {
  hasBeenTerminated: false,
  callId: 0,
};

export const terminateAllChildProcesses = async (callId = 0): Promise<void> => {
  if (callId !== terminateProcess.callId) {
    return;
  }
  if (terminateProcess.hasBeenTerminated) {
    return;
  }
  const pid = process.pid;
  const childPids = await getAllChildProccess(pid);

  childPids.forEach((pid) => {
    try {
      process.kill(pid, "SIGKILL");
    } catch (_e) {
      // Empty on purpose
    }
  });

  const newCallId = terminateProcess.callId + 1;

  terminateProcess.callId = newCallId;

  setTimeout(async () => {
    terminateAllChildProcesses(newCallId);
  }, 50);
};
