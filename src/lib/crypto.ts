import { createHash, randomBytes } from "crypto";

// Utilidades criptográficas centralizadas.

/** Hash SHA-256 em hex — usado para API keys e IPs. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Gera uma API key nova.
 * Formato: utm_<32 chars aleatórios url-safe>
 * Retorna a chave em texto (exibida UMA vez) + hash (armazenado) + prefixo (identificação).
 */
export function generateApiKey() {
  const key = `utm_${randomBytes(24).toString("base64url")}`;
  return {
    key,
    keyHash: sha256(key),
    keyPrefix: key.slice(0, 12), // "utm_a1b2c3d4"
  };
}
