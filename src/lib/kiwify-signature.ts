import { createHmac, timingSafeEqual } from "crypto";

// ============================================================
// Validação da assinatura do webhook Kiwify (defesa em profundidade).
//
// O Kiwify envia ?signature=<hmac-sha1 do corpo> em cada webhook,
// assinado com o token exibido no painel ao criar o webhook.
// Se KIWIFY_WEBHOOK_TOKEN estiver configurado no ambiente, validamos;
// se não estiver, seguimos apenas com a autenticação por API key
// (que continua obrigatória sempre).
// ============================================================

export function verifyKiwifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const token = process.env.KIWIFY_WEBHOOK_TOKEN;

  // Sem token configurado → validação desativada (API key ainda protege)
  if (!token) return true;

  if (!signature) return false;

  const expected = createHmac("sha1", token).update(rawBody).digest("hex");

  // Comparação em tempo constante — evita timing attacks
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
