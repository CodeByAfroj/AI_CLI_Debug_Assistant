import keytar from "keytar";

const SERVICE = "devfix-cli";
const ACCOUNT = "openrouter-api-key";

export async function saveApiKey(apiKey) {
  await keytar.setPassword(SERVICE, ACCOUNT, apiKey);
}

export async function getApiKey() {
  return await keytar.getPassword(SERVICE, ACCOUNT);
}

export async function deleteApiKey() {
  await keytar.deletePassword(SERVICE, ACCOUNT);
}
