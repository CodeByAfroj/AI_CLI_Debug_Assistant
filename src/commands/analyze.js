
import fs from "fs";
import chalk from "chalk";
import boxen from "boxen";
import logUpdate from "log-update";

import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

import { readConfig } from "../utils/config.js";
import { isSessionValid } from "../utils/session.js";
import { decrypt } from "../utils/cryptoStore.js";

import { collectContext } from "../utils/context.js";
import { detectStack } from "../utils/detectStack.js";
import { buildPrompt } from "../utils/prompt.js";
import { askAI } from "../utils/ai.js";

import { startDevFixLogo } from "../utils/animatedLogo.js";

// Markdown → terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer(),
});

export async function analyzeCommand({ text, file, stack, model, useContext }) {
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

  let input = text;

  if (file) {
    input = fs.readFileSync(file, "utf-8");
  }

  if (!input || input.trim().length < 2) {
    console.log(chalk.red("\n❌ Please provide error text or use --file\n"));
    process.exit(1);
  }

  const detected = stack || detectStack(input);
  const usedModel = model || "openai/gpt-4o-mini";
  const context = useContext ? collectContext() : {};

  // Start animation
  const anim = startDevFixLogo();

  const interval = setInterval(() => {
    logUpdate(
      `
${chalk.cyan(`${anim.frame()} DevFix`)} ${chalk.gray("• AI Debugging Assistant")}

${chalk.white("Stack:")}   ${chalk.yellow(detected)}
${chalk.white("Model:")}   ${chalk.magenta(usedModel)}
${chalk.white("Context:")} ${useContext ? chalk.green("ON") : chalk.red("OFF")}

${chalk.cyan("Analyzing error with AI...")}
`
    );
  }, 80);

  try {
    const prompt = buildPrompt({ stack: detected, input, context });
    const answer = await askAI({ apiKey, model: usedModel, prompt });

    // Stop animation
    clearInterval(interval);
    anim.stop();
    logUpdate.clear();

    // Print final output
    console.log(
      boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
        padding: 1,
        borderStyle: "round",
      })
    );

    console.log(marked(answer));
    console.log();
  } catch (err) {
    clearInterval(interval);
    anim.stop();
    logUpdate.clear();

    console.log(chalk.red("\n❌ AI request failed\n"));
    console.log(err?.response?.data || err.message);
    console.log();
  }
}
