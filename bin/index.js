#!/usr/bin/env node
import { Command } from "commander";

import { loginCommand } from "../src/commands/login.js";
import { logoutCommand } from "../src/commands/logout.js";
import { whoamiCommand } from "../src/commands/whoami.js";
import { analyzeCommand } from "../src/commands/analyze.js";
import { runCommand } from "../src/utils/run.js";


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
  .command("run")
  .description("Run a command and auto-capture errors for AI fixing")
  .option("-c, --context", "Include project/system context")
  .option("-s, --stack <stack>", "Force stack type")
  .option("-m, --model <model>", "OpenRouter model override")
  .argument("<cmd...>", "Command to run")
  .action((cmd, options) => {
    runCommand(cmd, {
      context: options.context,
      stack: options.stack,
      model: options.model,
    });
  });


program.parse(process.argv);
