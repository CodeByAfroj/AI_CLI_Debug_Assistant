#!/usr/bin/env node
import { Command } from "commander";

import { loginCommand } from "../src/commands/login.js";
import { logoutCommand } from "../src/commands/logout.js";
import { whoamiCommand } from "../src/commands/whoami.js";
import { analyzeCommand } from "../src/commands/analyze.js";
import { scanCommand } from "../src/commands/scan.js";


const program = new Command();

program
  .name("devfix")
  .description("DevFix CLI - AI tool to solve errors and bugs")
  .version("1.0.0");

program.command("login").description("Login and save session for 7 days").action(loginCommand);

program.command("logout").description("Logout and clear local session").action(logoutCommand);

program.command("whoami").description("Show current login session").action(whoamiCommand);

program
  .command("analyze")
  .description("Analyze an error/log with AI")
  .option("-f, --file <path>", "Read logs from a file")
  .option("-s, --stack <stack>", "Force stack (kubernetes/docker/nodejs/react/python/git)")
  .option("-m, --model <model>", "OpenRouter model override")
  .option("-c, --context", "Auto collect project/terminal context")
  .argument("[text]", "Error/log text")
  .action((text, options) => {
    analyzeCommand({
      text: text || "",
      file: options.file,
      stack: options.stack,
      model: options.model,
      useContext: options.context, 
    });
  });

program
  .command("scan")
  .description("Scan your system/project for recent errors and context")
  .option("-p, --preview", "Preview collected data only (recommended)")
  .option("-a, --analyze", "Send scan results to AI")
  .option("-m, --model <model>", "OpenRouter model override")
  .action((options) => {
    scanCommand({
      preview: options.preview,
      analyze: options.analyze,
      model: options.model,
    });
  });

program.parse(process.argv);
