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

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function collectContext() {
  const cwd = process.cwd();

  // Basic system info
  const context = {
    cwd,
    os: `${os.type()} ${os.release()}`,
    platform: os.platform(),
    arch: os.arch(),
    node: safeExec("node -v"),
    npm: safeExec("npm -v"),
    gitBranch: safeExec("git branch --show-current"),
  };

  // Node project detection
  const pkgPath = path.join(cwd, "package.json");
  const pkg = safeReadJson(pkgPath);

  if (pkg) {
    context.projectType = "node";
    context.projectName = pkg.name || null;
    context.dependencies = Object.keys(pkg.dependencies || {}).slice(0, 30);
    context.devDependencies = Object.keys(pkg.devDependencies || {}).slice(0, 30);
    context.scripts = pkg.scripts || {};
  }

  // Kubernetes tools detection
  const kubectl = safeExec("kubectl version --client=true --output=yaml");
  if (kubectl) {
    context.kubectlInstalled = true;
    context.kubectlVersion = kubectl.slice(0, 500);
  }

  const minikube = safeExec("minikube version");
  if (minikube) {
    context.minikubeInstalled = true;
    context.minikubeVersion = minikube;
  }

  return context;
}
