import { exec as execCallback } from "node:child_process";
import type { Express } from "express";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

const exec = promisify(execCallback),
 RETRY_DELAY_MS = 300;

interface PortConflict {
  pid: number;
  processName: string;
}

const parseWindowsPid = (netstatOutput: string, port: number): number | null => {
  const listeningLine = netstatOutput
    .split("\n")
    .find((line) => line.includes(`:${port} `) && line.includes("LISTENING"));
  if (!listeningLine) {
    return null;
  }
  const pidText = listeningLine.trim().split(/\s+/).at(-1),
   pid = pidText ? Number(pidText) : NaN;
  return Number.isNaN(pid) ? null : pid;
},

 findWindowsConflict = async (port: number): Promise<PortConflict | null> => {
  const { stdout: netstatOutput } = await exec("netstat -ano"),
   pid = parseWindowsPid(netstatOutput, port);
  if (pid === null) {
    return null;
  }
  const { stdout: taskListOutput } = await exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`),
   processName = taskListOutput.split(",")[0]?.replaceAll('"', "") ?? "unknown process";
  return { pid, processName };
},

 findPosixConflict = async (port: number): Promise<PortConflict | null> => {
  const { stdout: pidOutput } = await exec(`lsof -i :${port} -sTCP:LISTEN -t`),
   pid = Number(pidOutput.trim().split("\n")[0]);
  if (Number.isNaN(pid)) {
    return null;
  }
  const { stdout: commandOutput } = await exec(`ps -p ${pid} -o comm=`);
  return { pid, processName: commandOutput.trim() };
},

/** Best-effort lookup; swallows errors from missing tools (e.g. lsof) so callers get a graceful fallback. */
 findPortConflict = async (port: number): Promise<PortConflict | null> => {
  try {
    return await (process.platform === "win32" ? findWindowsConflict(port) : findPosixConflict(port));
  } catch {
    return null;
  }
},

 killProcess = async (pid: number): Promise<void> => {
  const command = process.platform === "win32" ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
  await exec(command);
},

 confirm = async (question: string): Promise<boolean> => {
  if (!process.stdin.isTTY) {
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout }),
   answer = await rl.question(question);
  rl.close();
  return /^y(es)?$/iu.test(answer.trim());
},

 handlePortInUse = async (app: Express, port: number): Promise<void> => {
  const conflict = await findPortConflict(port);
  if (!conflict) {
    process.stderr.write(`Port ${port} is already in use. Stop the process using it and retry.\n`);
    process.exit(1);
  }

  process.stderr.write(
    `Port ${port} is already in use by ${conflict.processName} (PID ${conflict.pid}).\n`,
  );
  const shouldKill = await confirm(`Kill PID ${conflict.pid} and retry? (y/N) `);
  if (!shouldKill) {
    process.exit(1);
  }

  await killProcess(conflict.pid);
  await delay(RETRY_DELAY_MS);
  listen(app, port);
};

export const listen = (app: Express, port: number): void => {
  const server = app.listen(port, () =>
    process.stdout.write(`Serving client at http://localhost:${port}\n`),
  );

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      void handlePortInUse(app, port);
    } else {
      process.stderr.write(`Failed to start server: ${error.message}\n`);
      process.exit(1);
    }
  });
};
