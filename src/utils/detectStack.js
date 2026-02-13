export function detectStack(text) {
  const t = text.toLowerCase();

  if (t.includes("kubectl") || t.includes("minikube") || t.includes("kubernetes")) return "kubernetes";
  if (t.includes("docker") || t.includes("container")) return "docker";
  if (t.includes("npm") || t.includes("node") || t.includes("express")) return "nodejs";
  if (t.includes("react") || t.includes("vite")) return "react";
  if (t.includes("python") || t.includes("pip")) return "python";
  if (t.includes("git") || t.includes("commit")) return "git";

  return "general";
}
