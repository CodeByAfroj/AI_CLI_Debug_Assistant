#!/usr/bin/env node
import { Command } from "commander";

import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { analyzeCommand } from "./commands/analyze.js";

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

program.parse(process.argv);
