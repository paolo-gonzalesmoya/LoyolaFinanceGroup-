import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// SSN/ITN: cifrar en la app antes de guardar, nunca en claro (comentario de
// docs/schema.sql sobre cliente.ssn_itn_cifrado). AES-256-GCM: autenticado,
// cualquier manipulación del valor guardado hace fallar el decrypt en vez de
// devolver basura silenciosamente.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.SSN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Falta SSN_ENCRYPTION_KEY (generar con: openssl rand -base64 32).");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SSN_ENCRYPTION_KEY debe decodificar a 32 bytes (generar con: openssl rand -base64 32).");
  }
  return key;
}

export function encryptSsn(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSsn(stored: string): string {
  const raw = Buffer.from(stored, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// Últimos 4 dígitos — lo único que la UI puede mostrar por defecto.
export function maskSsn(plaintext: string): string {
  const digits = plaintext.replace(/\D/g, "");
  return `•••-••-${digits.slice(-4)}`;
}

export function ssnLast4(stored: string): string {
  return maskSsn(decryptSsn(stored));
}
