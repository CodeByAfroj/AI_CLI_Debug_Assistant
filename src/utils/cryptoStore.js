import crypto from "crypto";

// Creates a machine-local key (same user on same machine)
function getSecretKey() {
  const user = process.env.USER || process.env.USERNAME || "devfix";
  const machine = process.env.HOSTNAME || "localmachine";

  // 32 bytes key for AES-256
  return crypto.createHash("sha256").update(user + machine).digest();
}

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = getSecretKey();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return iv.toString("base64") + ":" + encrypted;
}

export function decrypt(encryptedText) {
  const [ivBase64, encrypted] = encryptedText.split(":");
  if (!ivBase64 || !encrypted) return null;

  const iv = Buffer.from(ivBase64, "base64");
  const key = getSecretKey();

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
