import inquirer from "inquirer";
import chalk from "chalk";

import { writeConfig } from "../utils/config.js";
import { createSession } from "../utils/session.js";
import { encrypt } from "../utils/cryptoStore.js";

export async function loginCommand() {
  const answers = await inquirer.prompt([
    { name: "username", message: "Enter username:", type: "input" },
    { name: "email", message: "Enter email:", type: "input" },
    { name: "apiKey", message: "Enter OpenRouter API key:", type: "password", mask: "*" },
  ]);

  const session = createSession({
    username: answers.username.trim(),
    email: answers.email.trim(),
  });

  const apiKeyEncrypted = encrypt(answers.apiKey.trim());

  writeConfig({
    ...session,
    apiKeyEncrypted,
  });

  console.log(chalk.green("\n✅ Login saved for 7 days.\n"));
}
