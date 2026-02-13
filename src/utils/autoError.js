import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function collectAutoError() {
  const cwd = process.cwd();

  // 1) npm debug log (most common)
  const npmLog = path.join(os.homedir(), ".npm", "_logs");
  if (fs.existsSync(npmLog)) {
    const files = fs
      .readdirSync(npmLog)
      .filter((f) => f.endsWith(".log"))
      .map((f) => ({
        name: f,
        full: path.join(npmLog, f),
        time: fs.statSync(path.join(npmLog, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
      const latest = files[0].full;
      const content = fs.readFileSync(latest, "utf-8").slice(-6000);
      return `📌 Auto-collected npm debug log:\nFile: ${latest}\n\n${content}`;
    }
  }

  // 2) Git status (sometimes shows merge conflicts)
  const git = safeExec("git status --porcelain=v1");
  if (git && git.trim().length > 0) {
    return `📌 Auto-collected Git status:\n\n${git}`;
  }

  // 3) Kubernetes events (if cluster exists)
  const events = safeExec(
    "kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 25"
  );
  if (events) {
    return `📌 Auto-collected Kubernetes events:\n\n${events}`;
  }

  // Nothing found
  return null;
}
