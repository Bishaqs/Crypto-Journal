import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

export function encrypt(text: string): { encrypted: string; iv: string } {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    // Dev fallback — base64 (NOT secure for production)
    return { encrypted: Buffer.from(text).toString("base64"), iv: "dev" };
  }
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf-8");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

export function decrypt(encrypted: string, ivHex: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32 || ivHex === "dev") {
    // Dev fallback — base64
    return Buffer.from(encrypted, "base64").toString("utf-8");
  }
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf-8");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
