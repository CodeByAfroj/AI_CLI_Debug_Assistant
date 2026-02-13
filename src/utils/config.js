import fs from "fs";
import os from "os";
import path from "path";

const DIR = path.join(os.homedir(), ".devfix");
const FILE = path.join(DIR, "config.json");

export function ensureConfigDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

export function readConfig() {
  try {
    if (!fs.existsSync(FILE)) return null;
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeConfig(data) {
  ensureConfigDir();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function deleteConfig() {
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
}

export function getConfigPath() {
  return FILE;
}
