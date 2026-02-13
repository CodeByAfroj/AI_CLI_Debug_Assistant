// import chalk from "chalk";
// import boxen from "boxen";
// import inquirer from "inquirer";
// import ora from "ora";
// import { spawn } from "child_process";

// import { marked } from "marked";
// import TerminalRenderer from "marked-terminal";

// import { readConfig } from "../utils/config.js";
// import { isSessionValid } from "../utils/session.js";
// import { decrypt } from "../utils/cryptoStore.js";

// import { collectContext } from "../utils/context.js";
// import { detectStack } from "../utils/detectStack.js";
// import { buildPrompt } from "../utils/prompt.js";
// import { askAI } from "../utils/ai.js";

// // Markdown renderer
// marked.setOptions({
//   renderer: new TerminalRenderer(),
// });

// export async function runCommand(cmdArgs, options) {
//   const config = readConfig();

//   if (!isSessionValid(config)) {
//     console.log(chalk.red("\n❌ Not logged in or session expired.\nRun: devfix login\n"));
//     process.exit(1);
//   }

//   const apiKey = decrypt(config.apiKeyEncrypted);
//   if (!apiKey) {
//     console.log(chalk.red("\n❌ API key missing. Run: devfix login\n"));
//     process.exit(1);
//   }

//   if (!cmdArgs || cmdArgs.length === 0) {
//     console.log(chalk.red("\n❌ Please provide a command.\nExample: devfix run kubectl get pods\n"));
//     process.exit(1);
//   }

//   const command = cmdArgs[0];
//   const args = cmdArgs.slice(1);
//   const fullCmd = `${command} ${args.join(" ")}`.trim();

//   console.log(
//     boxen(
//       `${chalk.bold.cyan("▶ DevFix Run")}\n\n${chalk.white("Command:")} ${chalk.yellow(fullCmd)}\n${
//         options.context ? chalk.green("Context: ON") : chalk.red("Context: OFF")
//       }`,
//       { padding: 1, borderStyle: "round" }
//     )
//   );

//   // ✅ No shell=true (removes the security warning)
//   const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"] });

//   let stdout = "";
//   let stderr = "";

//   child.stdout.on("data", (d) => {
//     const text = d.toString();
//     stdout += text;
//     process.stdout.write(text);
//   });

//   child.stderr.on("data", (d) => {
//     const text = d.toString();
//     stderr += text;
//     process.stderr.write(text);
//   });

//   child.on("close", async (code) => {
//     if (code === 0) {
//       console.log(chalk.green("\n✅ Command succeeded.\n"));
//       return;
//     }

//     const errorText = (stderr || stdout || "").trim();

//     console.log(chalk.red(`\n❌ Command failed (exit code: ${code}).\n`));

//     if (!errorText) {
//       console.log(chalk.red("No error output captured.\n"));
//       return;
//     }

//     console.log(
//       boxen(chalk.bold.red("⚠️ Captured Error"), {
//         padding: 1,
//         borderStyle: "round",
//       })
//     );

//     console.log(chalk.red(errorText.slice(0, 1200)));
//     if (errorText.length > 1200) console.log(chalk.gray("\n...trimmed...\n"));

//     const { confirm } = await inquirer.prompt([
//       {
//         name: "confirm",
//         type: "confirm",
//         message: "Send this error to DevFix AI for a fix?",
//         default: true,
//       },
//     ]);

//     if (!confirm) {
//       console.log(chalk.yellow("\n❌ Not sent to AI.\n"));
//       return;
//     }

//     const context = options.context ? collectContext() : {};
//     const stack = options.stack || detectStack(errorText);
//     const usedModel = options.model || "openai/gpt-4o-mini";

//     // 🔥 Send a better bundle (so AI never asks useless questions)
//     const errorBundle = `
// Command:
// ${fullCmd}

// Exit Code:
// ${code}

// Error Output:
// ${errorText}
// `.trim();

//     console.log(
//       boxen(
//         `${chalk.bold.white("Stack:")} ${chalk.cyan(stack)}\n${chalk.bold.white("Model:")} ${chalk.magenta(
//           usedModel
//         )}`,
//         { padding: 1, borderStyle: "round" }
//       )
//     );

//     const spinner = ora("DevFix AI is analyzing...").start();

//     try {
//       const prompt = buildPrompt({
//         stack,
//         input: errorBundle,
//         context,
//       });

//       const answer = await askAI({
//         apiKey,
//         model: usedModel,
//         prompt,
//       });

//       spinner.succeed("Analysis complete");

//       console.log(
//         boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
//           padding: 1,
//           borderStyle: "round",
//         })
//       );

//       // ✅ Pretty output (markdown rendered)
//       console.log(marked(answer));
//       console.log();
//     } catch (err) {
//       spinner.fail("AI request failed");

//       console.log(chalk.red("\n❌ Error:\n"));
//       console.log(err?.response?.data || err.message);
//       console.log();
//     }
//   });
//   child.on("error", async (err) => {
//   if (err.code === "ENOENT") {
//     console.log(chalk.red(`\n❌ Command not found: ${command}\n`));
//     console.log(chalk.gray("Tip: Did you mean `kubectl`?\n"));

//     const { confirm } = await inquirer.prompt([
//       {
//         name: "confirm",
//         type: "confirm",
//         message: "Send this error to DevFix AI for a fix?",
//         default: true,
//       },
//     ]);

//     if (!confirm) {
//       console.log(chalk.yellow("\n❌ Not sent to AI.\n"));
//       process.exit(1);
//     }

//     const errorText = `Command not found: ${command}\nTried to run: ${fullCmd}`;
//     const context = options.context ? collectContext() : {};
//     const stack = options.stack || detectStack(errorText);
//     const usedModel = options.model || "openai/gpt-4o-mini";

//     const spinner = ora("DevFix AI is analyzing...").start();

//     try {
//       const prompt = buildPrompt({
//         stack,
//         input: errorText,
//         context,
//       });

//       const answer = await askAI({
//         apiKey,
//         model: usedModel,
//         prompt,
//       });

//       spinner.succeed("Analysis complete");

//       console.log(
//         boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
//           padding: 1,
//           borderStyle: "round",
//         })
//       );

//       console.log(marked(answer));
//       console.log();
//     } catch (e) {
//       spinner.fail("AI request failed");
//       console.log(chalk.red("\n❌ Error:\n"));
//       console.log(e?.response?.data || e.message);
//       console.log();
//     }

//     process.exit(1);
//   }

//   console.log(chalk.red("\n❌ Failed to run command:\n"));
//   console.log(err.message);
//   process.exit(1);
// });

// }


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

  // ✅ Prevent duplicate prompts + duplicate AI calls
  let handled = false;

  console.log(
    boxen(
      `${chalk.bold.cyan("▶ DevFix Run")}\n\n${chalk.white("Command:")} ${chalk.yellow(fullCmd)}\n${
        options.context ? chalk.green("Context: ON") : chalk.red("Context: OFF")
      }`,
      { padding: 1, borderStyle: "round" }
    )
  );

  // ✅ No shell=true (removes security warning)
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

  // ✅ Handle "command not found"
  child.on("error", async (err) => {
    if (handled) return;
    handled = true;

    if (err.code === "ENOENT") {
      console.log(chalk.red(`\n❌ Command not found: ${command}\n`));
      console.log(chalk.gray("Tip: Did you mean `kubectl`?\n"));

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

      const errorText = `Command not found: ${command}\nTried to run: ${fullCmd}`;
      const context = options.context ? collectContext() : {};
      const stack = options.stack || detectStack(errorText);
      const usedModel = options.model || "openai/gpt-4o-mini";

      const spinner = ora("DevFix AI is analyzing...").start();

      try {
        const prompt = buildPrompt({
          stack,
          input: errorText,
          context,
        });

        const answer = await askAI({
          apiKey,
          model: usedModel,
          prompt,
        });

        spinner.succeed("Analysis complete");

        console.log(
          boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
            padding: 1,
            borderStyle: "round",
          })
        );

        console.log(marked(answer));
        console.log();
      } catch (e) {
        spinner.fail("AI request failed");
        console.log(chalk.red("\n❌ Error:\n"));
        console.log(e?.response?.data || e.message);
        console.log();
      }

      process.exit(1);
    }

    console.log(chalk.red("\n❌ Failed to run command:\n"));
    console.log(err.message);
    process.exit(1);
  });

  // ✅ Handle normal command exit
  child.on("close", async (code) => {
    if (handled) return;
    handled = true;

    if (code === 0) {
      console.log(chalk.green("\n✅ Command succeeded.\n"));
      return;
    }

    const errorText = (stderr || stdout || "").trim();

    console.log(chalk.red(`\n❌ Command failed (exit code: ${code}).\n`));

    if (!errorText) {
      console.log(chalk.red("No error output captured.\n"));
      return;
    }

    console.log(
      boxen(chalk.bold.red("⚠️ Captured Error"), {
        padding: 1,
        borderStyle: "round",
      })
    );

    console.log(chalk.red(errorText.slice(0, 1200)));
    if (errorText.length > 1200) console.log(chalk.gray("\n...trimmed...\n"));

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

    const errorBundle = `
Command:
${fullCmd}

Exit Code:
${code}

Error Output:
${errorText}
`.trim();

    console.log(
      boxen(
        `${chalk.bold.white("Stack:")} ${chalk.cyan(stack)}\n${chalk.bold.white("Model:")} ${chalk.magenta(
          usedModel
        )}`,
        { padding: 1, borderStyle: "round" }
      )
    );

    const spinner = ora("DevFix AI is analyzing...").start();

    try {
      const prompt = buildPrompt({
        stack,
        input: errorBundle,
        context,
      });

      const answer = await askAI({
        apiKey,
        model: usedModel,
        prompt,
      });

      spinner.succeed("Analysis complete");

      console.log(
        boxen(chalk.bold.green("✅ DevFix Suggested Fix"), {
          padding: 1,
          borderStyle: "round",
        })
      );

      console.log(marked(answer));
      console.log();
    } catch (err) {
      spinner.fail("AI request failed");

      console.log(chalk.red("\n❌ Error:\n"));
      console.log(err?.response?.data || err.message);
      console.log();
    }
  });
}
