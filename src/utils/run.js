import chalk from "chalk";
import boxen from "boxen";
import inquirer from "inquirer";
import ora from "ora";
import { spawn } from "child_process";

import { readConfig } from "../utils/config.js";
import { isSessionValid } from "../utils/session.js";
import { decrypt } from "../utils/cryptoStore.js";

import { collectContext } from "../utils/context.js";
import { detectStack } from "../utils/detectStack.js";
import { buildPrompt } from "../utils/prompt.js";
import { askAI } from "../utils/ai.js";

function headerBox({ fullCmd, contextOn }) {
  return boxen(
    `${chalk.bold.cyan("DevFix Run")}\n` +
      `${chalk.gray("────────────────────────")}\n` +
      `${chalk.white("Command:")} ${chalk.yellow(fullCmd)}\n` +
      `${chalk.white("Context:")} ${contextOn ? chalk.green("ON") : chalk.red("OFF")}`,
    { padding: 1, borderStyle: "round" }
  );
}

function extractFirstCodeBlock(md) {
  const match = md.match(/```(?:bash|sh)?\n([\s\S]*?)```/);
  if (!match) return null;
  return match[1].trim();
}

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

  console.log("\n" + headerBox({ fullCmd, contextOn: !!options.context }) + "\n");

  const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"] });

  let stdout = "";
  let stderr = "";

  // ✅ Still show live output (like normal terminal)
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

  // ✅ Command not found
  child.on("error", async (err) => {
    if (handled) return;
    handled = true;

    const msg =
      err.code === "ENOENT"
        ? `Command not found: ${command}`
        : `Failed to run: ${fullCmd}\n${err.message}`;

    console.log(chalk.red(`\n❌ ${msg}\n`));

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Send to DevFix AI?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("\n❌ Not sent.\n"));
      process.exit(1);
    }

    const errorBundle = `
Command: ${fullCmd}

Error:
${msg}
`.trim();

    const context = options.context ? collectContext() : {};
    const stack = options.stack || detectStack(errorBundle);
    const usedModel = options.model || "openai/gpt-4o-mini";

    const spinner = ora("DevFix AI is analyzing...").start();

    try {
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

      spinner.succeed("Done");

      const answer = cleanAIText(answerRaw);
      const mainCmd = extractFirstCodeBlock(answer);

      if (mainCmd) {
        console.log(
          "\n" +
            boxen(`${chalk.bold.green("Main Fix (copy-paste)")}\n\n${chalk.cyan(mainCmd)}`, {
              padding: 1,
              borderStyle: "round",
            }) +
            "\n"
        );
      }

      console.log(
        boxen(`${chalk.bold.white("Explanation")}\n\n${answer}`, {
          padding: 1,
          borderStyle: "round",
        }) + "\n"
      );
    } catch (e) {
      spinner.fail("AI request failed");
      console.log(chalk.red("\n❌ Error:\n"));
      console.log(e?.response?.data || e.message);
      console.log();
    }

    process.exit(1);
  });

  // ✅ Normal close
  child.on("close", async (code) => {
    if (handled) return;
    handled = true;

    if (code === 0) {
      console.log(chalk.green("\n✅ Command succeeded.\n"));
      return;
    }

    // ⚠️ We do NOT print captured error again (already shown above)
    const errorText = (stderr || stdout || "").trim();

    console.log(chalk.red(`\n❌ Command failed (exit code: ${code}).\n`));

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Send this error to DevFix AI?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("\n❌ Not sent.\n"));
      return;
    }

    const context = options.context ? collectContext() : {};
    const stack = options.stack || detectStack(errorText);
    const usedModel = options.model || "openai/gpt-4o-mini";

    const errorBundle = `
Command: ${fullCmd}
Exit Code: ${code}

Error Output:
${errorText}
`.trim();

    const spinner = ora("DevFix AI is analyzing...").start();

    try {
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

      spinner.succeed("Done");

      const answer = cleanAIText(answerRaw);
      const mainCmd = extractFirstCodeBlock(answer);

      if (mainCmd) {
        console.log(
          "\n" +
            boxen(`${chalk.bold.green("Main Fix (copy-paste)")}\n\n${chalk.cyan(mainCmd)}`, {
              padding: 1,
              borderStyle: "round",
            }) +
            "\n"
        );
      }

      console.log(
        boxen(`${chalk.bold.white("Explanation")}\n\n${answer}`, {
          padding: 1,
          borderStyle: "round",
        }) + "\n"
      );
    } catch (e) {
      spinner.fail("AI request failed");
      console.log(chalk.red("\n❌ Error:\n"));
      console.log(e?.response?.data || e.message);
      console.log();
    }
  });
}
