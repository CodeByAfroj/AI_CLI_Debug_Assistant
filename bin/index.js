#!/usr/bin/env node
// import { Command } from "commander";
// import { createRequire } from "module";

// import { loginCommand } from "../src/commands/login.js";
// import { logoutCommand } from "../src/commands/logout.js";
// import { whoamiCommand } from "../src/commands/whoami.js";
// import { analyzeCommand } from "../src/commands/analyze.js";
// import { runCommand } from "../src/utils/run.js";

// const require = createRequire(import.meta.url);
// const pkg = require("../package.json");

// const program = new Command();

// program
//   .name("devfix")
//   .description("DevFix CLI - AI tool to solve errors and bugs")
//   .version(pkg.version);

// program.command("login").description("Login and save session for 7 days").action(loginCommand);

// program.command("logout").description("Logout and clear local session").action(logoutCommand);

// program.command("whoami").description("Show current login session").action(whoamiCommand);

// program
//   .command("analyze")
//   .description("Analyze an error/log with AI")
//   .option("-f, --file <path>", "Read logs from a file")
//   .option("-s, --stack <stack>", "Force stack (kubernetes/docker/nodejs/react/python/git)")
//   .option("-m, --model <model>", "OpenRouter model override")
//   .option("-c, --context", "Auto collect project/terminal context")
//   .argument("[text]", "Error/log text")
//   .action((text, options) => {
//     analyzeCommand({
//       text: text || "",
//       file: options.file,
//       stack: options.stack,
//       model: options.model,
//       useContext: options.context,
//     });
//   });

// program
//   .command("run")
//   .description("Run a command and auto-capture errors for AI fixing")
//   .option("-c, --context", "Include project/system context")
//   .option("-s, --stack <stack>", "Force stack type")
//   .option("-m, --model <model>", "OpenRouter model override")
//   .argument("<cmd...>", "Command to run")
//   .action((cmd, options) => {
//     runCommand(cmd, {
//       context: options.context,
//       stack: options.stack,
//       model: options.model,
//     });
//   });

// program.parse(process.argv);


import { Command } from "commander";
import { createRequire } from "module";
import chalk from "chalk";

import { loginCommand } from "../src/commands/login.js";
import { logoutCommand } from "../src/commands/logout.js";
import { whoamiCommand } from "../src/commands/whoami.js";
import { analyzeCommand } from "../src/commands/analyze.js";
import { runCommand } from "../src/utils/run.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

// 🎨 Custom help styling
program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,

  formatHelp: (cmd, helper) => {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth || 80;

    let out = "";

    // Title
    out += `\n${chalk.bold.cyan("🚀 DevFix CLI")}\n`;
    out += `${chalk.gray("AI tool to solve errors and bugs")}\n\n`;

    // Usage
    out += `${chalk.bold.yellow("Usage:")}\n`;
    out += `  ${chalk.green(cmd.name())} ${chalk.gray("[command]")} ${chalk.gray("[options]")}\n\n`;

    // Commands
    const commands = helper.visibleCommands(cmd);
    if (commands.length) {
      out += `${chalk.bold.yellow("Commands:")}\n`;

      for (const c of commands) {
        const name = c.name().padEnd(termWidth);
        const desc = c.description();
        out += `  ${chalk.cyan(name)}  ${chalk.gray(desc)}\n`;
      }
      out += "\n";
    }

    // Options
    const options = helper.visibleOptions(cmd);
    if (options.length) {
      out += `${chalk.bold.yellow("Options:")}\n`;

      for (const o of options) {
        const flags = helper.optionTerm(o).padEnd(termWidth);
        const desc = helper.optionDescription(o);
        out += `  ${chalk.magenta(flags)}  ${chalk.gray(desc)}\n`;
      }
      out += "\n";
    }

    // Footer
    out += `${chalk.gray("Version:")} ${chalk.bold.white(pkg.version)}\n`;
    out += `${chalk.gray("Run")} ${chalk.green("devfix <command> --help")} ${chalk.gray("for details.")}\n\n`;

    return out;
  },
});

program
  .name("devfix")
  .description("DevFix CLI - AI tool to solve errors and bugs")
  .version(pkg.version);

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
