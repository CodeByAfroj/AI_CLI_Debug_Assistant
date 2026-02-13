import chalk from "chalk";
import boxen from "boxen";

import { readConfig } from "../utils/config.js";
import { isSessionValid } from "../utils/session.js";
import { decrypt } from "../utils/cryptoStore.js";

import { collectContext } from "../utils/context.js";
import { collectAutoError } from "../utils/autoError.js";
import { detectStack } from "../utils/detectStack.js";
import { buildPrompt } from "../utils/prompt.js";
import { askAI } from "../utils/ai.js";

export async function scanCommand({ preview, analyze, model }) {
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

  const context = collectContext();
  const autoErr = collectAutoError();

  const detected = detectStack(autoErr || "");
  const usedModel = model || "openai/gpt-4o-mini";

  console.log(
    boxen(chalk.bold.cyan("🔎 DevFix Scan Results"), {
      padding: 1,
      borderStyle: "round",
    })
  );

  console.log(chalk.white("\nContext collected:"));
  console.log(chalk.gray(JSON.stringify(context, null, 2)));

  console.log(chalk.white("\nAuto error detected:"));
  if (autoErr) {
    console.log(chalk.yellow(autoErr.slice(0, 2500)));
    if (autoErr.length > 2500) console.log(chalk.gray("\n...trimmed output...\n"));
  } else {
    console.log(chalk.red("❌ No recent error log found."));
  }

  console.log(chalk.white("\nDetected stack: ") + chalk.cyan(detected));
  console.log(chalk.white("Model: ") + chalk.magenta(usedModel));
  console.log();

  // If only preview requested
  if (preview && !analyze) {
    console.log(chalk.green("✅ Preview complete. Nothing was sent to AI.\n"));
    return;
  }

  // If analyze requested
  if (analyze) {
    if (!autoErr) {
      console.log(chalk.red("\n❌ No error found to analyze.\n"));
      console.log(chalk.gray("Tip: Run devfix analyze \"your error\" --context\n"));
      process.exit(1);
    }

    console.log(chalk.cyan("🤖 Sending scan data to AI...\n"));

    const prompt = buildPrompt({
      stack: detected,
      input: autoErr,
      context,
    });

    const answer = await askAI({
      apiKey,
      model: usedModel,
      prompt,
    });

    console.log(
      boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
        padding: 1,
        borderStyle: "round",
      })
    );

    console.log(answer);
    console.log();
  }
}
