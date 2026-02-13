export function isSessionValid(config) {
  if (!config) return false;
  if (!config.expiresAt) return false;

  const expiresAt = new Date(config.expiresAt).getTime();
  const now = Date.now();

  return now < expiresAt;
}

export function createSession({ username, email }) {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    username,
    email,
    loggedInAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}
