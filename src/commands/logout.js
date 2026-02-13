import chalk from "chalk";
import { deleteConfig } from "../utils/config.js";

export async function logoutCommand() {
  deleteConfig();
  console.log(chalk.yellow("\n👋 Logged out. Session cleared.\n"));
}
