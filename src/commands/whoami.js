import chalk from "chalk";
import { readConfig, getConfigPath } from "../utils/config.js";
import { isSessionValid } from "../utils/session.js";

export async function whoamiCommand() {
  const config = readConfig();

  if (!config) {
    console.log(chalk.red("\n❌ Not logged in.\n"));
    return;
  }

  console.log(chalk.cyan("\n👤 DevFix User\n"));
  console.log("Username:", config.username);
  console.log("Email:", config.email);
  console.log("Config:", getConfigPath());

  if (isSessionValid(config)) {
    console.log(chalk.green("\n✅ Session valid until:"), config.expiresAt, "\n");
  } else {
    console.log(chalk.red("\n⏳ Session expired. Please run devfix login\n"));
  }
}
