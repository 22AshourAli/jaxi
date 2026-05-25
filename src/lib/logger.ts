const SENSITIVE_FIELDS = ["phone", "token", "password", "key", "secret"];

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...obj };
  for (const key of Object.keys(cleaned)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
      cleaned[key] = "[REDACTED]";
    }
  }
  return cleaned;
}

const log = (level: "info" | "warn" | "error", event: string, data?: Record<string, unknown>, err?: unknown) => {
  const payload = { event, ...(data ? sanitize(data) : {}), ...(err ? { error: String(err) } : {}) };
  const ts = new Date().toISOString();
  const msg = `[${ts}] [${level.toUpperCase()}] ${JSON.stringify(payload)}`;

  if (level === "error") {
    console.error(msg);
  } else if (level === "warn") {
    console.warn(msg);
  } else {
    console.log(msg);
  }
};

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>, err?: unknown) => log("error", event, data, err),
};
