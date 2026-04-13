import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(name: string, expectedBytes: number): Buffer {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  const key = Buffer.from(value, "hex");
  if (key.length !== expectedBytes) {
    throw new Error(
      `${name} must be ${expectedBytes * 2} hex chars (${expectedBytes} bytes)`,
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey("ENCRYPTION_KEY", 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = getKey("ENCRYPTION_KEY", 32);
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buf.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function hmacPassword(plaintext: string): string {
  const key = getKey("HMAC_KEY", 32);
  return createHmac("sha256", key).update(plaintext, "utf8").digest("hex");
}
