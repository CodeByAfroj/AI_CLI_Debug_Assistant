import chalk from "chalk";
import boxen from "boxen";
import inquirer from "inquirer";
import ora from "ora";
import { spawn } from "child_process";

import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

import { readConfig } from "../utils/config.js";
import { isSessionValid } from "../utils/session.js";
import { decrypt } from "../utils/cryptoStore.js";

import { collectContext } from "../utils/context.js";
import { detectStack } from "../utils/detectStack.js";
import { buildPrompt } from "../utils/prompt.js";
import { askAI } from "../utils/ai.js";

// Markdown renderer
marked.setOptions({
  renderer: new TerminalRenderer(),
});

// Extract first code block for "Main Fix"
function extractFirstCodeBlock(md) {
  const match = md.match(/```(?:bash|sh)?\n([\s\S]*?)```/);
  if (!match) return null;
  return match[1].trim();
}

// Clean AI output (remove ugly markdown indent)
function cleanAIText(text) {
  return (text || "")
    .replace(/\n {4,}/g, "\n")
    .replace(/\n\n{3,}/g, "\n\n")
    .trim();
}

export async function runCommand(cmdArgs, options) {
  const config = readConfig();

  if (!isSessionValid(config)) {
    console.log(chalk.red("\n❌ Not logged in or session expired.\nRun: devfix login\n"));
    process.exit(1);
  }

  const apiKey = decrypt(config.apiKeyEncrypted);
  if (!apiKey) {
    console.log(chalk.red("\n❌ API key missing. Run: devfix login\n"));
    process.exit(1);
  }

  if (!cmdArgs || cmdArgs.length === 0) {
    console.log(chalk.red("\n❌ Please provide a command.\nExample: devfix run kubectl get pods\n"));
    process.exit(1);
  }

  const command = cmdArgs[0];
  const args = cmdArgs.slice(1);
  const fullCmd = `${command} ${args.join(" ")}`.trim();

  let handled = false;

  // ✅ Keep your old UI header style
  console.log(
    boxen(
      `${chalk.bold.cyan("▶ DevFix Run")}\n\n${chalk.white("Command:")} ${chalk.yellow(fullCmd)}\n${
        options.context ? chalk.green("Context: ON") : chalk.red("Context: OFF")
      }`,
      { padding: 1, borderStyle: "round" }
    )
  );

  // No shell=true
  const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"] });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (d) => {
    const text = d.toString();
    stdout += text;
    process.stdout.write(text);
  });

  child.stderr.on("data", (d) => {
    const text = d.toString();
    stderr += text;
    process.stderr.write(text);
  });

  // ✅ Handle "command not found" cleanly (no duplicate close handler)
  child.on("error", async (err) => {
    if (handled) return;
    handled = true;

    const msg =
      err.code === "ENOENT"
        ? `Command not found: ${command}\n\nTip: Example: devfix run kubectl get pods`
        : `Failed to run command:\n${err.message}`;

    console.log(chalk.red(`\n❌ ${msg}\n`));

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Send this error to DevFix AI for a fix?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("\n❌ Not sent to AI.\n"));
      process.exit(1);
    }

    const context = options.context ? collectContext() : {};
    const stack = options.stack || detectStack(msg);
    const usedModel = options.model || "openai/gpt-4o-mini";

    const spinner = ora("DevFix AI is analyzing...").start();

    try {
      const prompt = buildPrompt({
        stack,
        input: `Command: ${fullCmd}\n\n${msg}`,
        context,
      });

      const answerRaw = await askAI({
        apiKey,
        model: usedModel,
        prompt,
      });

      spinner.succeed("Analysis complete");

      const answer = cleanAIText(answerRaw);
      const mainFix = extractFirstCodeBlock(answer);

      // ✅ Main Fix box (easy copy)
      if (mainFix) {
        console.log(
          boxen(chalk.bold.green("🚀 Main Fix (copy-paste)") + `\n\n${chalk.cyan(mainFix)}`, {
            padding: 1,
            borderStyle: "round",
          })
        );
      }

      // ✅ Explanation box
      console.log(
        boxen(chalk.bold.white("🧠 Explanation") + `\n\n${marked(answer)}`, {
          padding: 1,
          borderStyle: "round",
        })
      );

      console.log();
    } catch (e) {
      spinner.fail("AI request failed");
      console.log(chalk.red("\n❌ Error:\n"));
      console.log(e?.response?.data || e.message);
      console.log();
    }

    process.exit(1);
  });

  // ✅ Handle normal close
  child.on("close", async (code) => {
    if (handled) return;
    handled = true;

    if (code === 0) {
      console.log(chalk.green("\n✅ Command succeeded.\n"));
      return;
    }

    const errorText = (stderr || stdout || "").trim();

    console.log(chalk.red(`\n❌ Command failed (exit code: ${code}).\n`));

    // ❌ No Captured Error box (no repetition)
    // because error already printed above by kubectl/npm/etc.

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Send this error to DevFix AI for a fix?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("\n❌ Not sent to AI.\n"));
      return;
    }

    const context = options.context ? collectContext() : {};
    const stack = options.stack || detectStack(errorText);
    const usedModel = options.model || "openai/gpt-4o-mini";

    const spinner = ora("DevFix AI is analyzing...").start();

    try {
      const errorBundle = `
Command:
${fullCmd}

Exit Code:
${code}

Error Output:
${errorText}
`.trim();

      const prompt = buildPrompt({
        stack,
        input: errorBundle,
        context,
      });

      const answerRaw = await askAI({
        apiKey,
        model: usedModel,
        prompt,
      });

      spinner.succeed("Analysis complete");

      const answer = cleanAIText(answerRaw);
      const mainFix = extractFirstCodeBlock(answer);

      // ✅ Main Fix box
      if (mainFix) {
        console.log(
          boxen(chalk.bold.green("🚀 Main Fix (copy-paste)") + `\n\n${chalk.cyan(mainFix)}`, {
            padding: 1,
            borderStyle: "round",
          })
        );
      }

      // ✅ Explanation box
      console.log(
        boxen(chalk.bold.white("🧠 Explanation") + `\n\n${marked(answer)}`, {
          padding: 1,
          borderStyle: "round",
        })
      );

      console.log();
    } catch (err) {
      spinner.fail("AI request failed");

      console.log(chalk.red("\n❌ Error:\n"));
      console.log(err?.response?.data || err.message);
      console.log();
    }
  });
}
