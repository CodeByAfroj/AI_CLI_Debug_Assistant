# DevFix CLI 🚀  
AI-powered CLI tool that helps you debug errors, logs, and DevOps issues directly from your terminal.

DevFix analyzes your error output (Node, Docker, Kubernetes, Minikube, Git, etc.) and suggests the most likely fix with copy-paste commands.

---

## ✨ Features

- 🔐 Login once (saved locally for 7 days)
- 🤖 Uses OpenRouter API (supports many models)
- 🧠 Auto-detects stack (Node, Docker, Kubernetes, Git, Python, React)
- 📦 Optional auto context mode (`--context`)
- 🎬 Animated DevFix logo during analysis (Minikube-style)
- 🧾 Clean Markdown output in terminal
- 🧩 Works on macOS / Linux / Windows

---

### 1) Install DevFix globally
```bash
npm install -g devfix
```

Check installation:
```bash
devfix --version
```

---

### 2) Login (required)

DevFix needs your OpenRouter API key to work.

Run:
```bash
devfix login
```

It will ask for:
- Username
- Email
- OpenRouter API Key

Your login is saved locally for **7 days**, so you don’t need to login again daily.

---

### 3) Start using DevFix

Analyze an error directly:
```bash
devfix analyze "npm install failing"
```

Analyze with automatic context collection (recommended):
```bash
devfix analyze "minikube ingress not working" --context
```

Analyze a log file:
```bash
devfix analyze --file error.log
```

---

### 4) Session commands

Check current login:
```bash
devfix whoami
```

Logout:
```bash
devfix logout
```

scan -> collects context + auto errors:
```bash
devfix scan
```

scan preview -> shows what it found:
```bash
devfix scan --preview 
```

sacn analyze -> Send scan results to AI:
```bash
devfix scan -a 
```

