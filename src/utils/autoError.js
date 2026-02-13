import fs from "fs";
import os from "os";
import path from "path";

function getLatestFile(dir, ext = ".log") {
  try {
    if (!fs.existsSync(dir)) return null;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(ext))
      .map((f) => ({
        name: f,
        full: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    return files.length ? files[0].full : null;
  } catch {
    return null;
  }
}

function extractNpmError(logText) {
  const lines = logText.split("\n");

  // Most npm errors appear in these patterns
  const keywords = ["npm ERR!", "error", "ERR_", "EACCES", "ENOTFOUND", "ECONNRESET"];

  // Find first error-like line
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      startIndex = i;
      break;
    }
  }

  // If no errors found, return null
  if (startIndex === -1) return null;

  // Take a clean block after the error line
  const extracted = lines.slice(startIndex, startIndex + 60).join("\n");

  // Remove useless "silly" lines
  return extracted
    .split("\n")
    .filter((l) => !l.includes("silly"))
    .slice(0, 60)
    .join("\n")
    .trim();
}

export function collectAutoError() {
  const npmLogsDir = path.join(os.homedir(), ".npm", "_logs");
  const latestNpmLog = getLatestFile(npmLogsDir, ".log");

  if (latestNpmLog) {
    const raw = fs.readFileSync(latestNpmLog, "utf-8");
    const extracted = extractNpmError(raw);

    if (extracted) {
      return {
        source: "npm" | "kubernetes" | "docker" | "git",
        title: "Short readable error title",
        file: "...optional",
        extracted: "error lines",
     }

    }
  }

  return null;
}
