import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";

// Autenticação da API pública por chave.
// Aceita a chave em 3 lugares (nesta ordem):
// 1. Header "x-api-key"        → integrações modernas
// 2. Header "Authorization: Bearer ..." → padrão REST
// 3. Query string "?key=..."   → webhooks que não permitem headers (Kiwify)

export async function authenticateApiKey(
  request: Request
): Promise<{ projectId: string; apiKeyId: string } | null> {
  const url = new URL(request.url);

  const raw =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("key");

  if (!raw || !raw.startsWith("utm_")) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(raw) },
    select: { id: true, projectId: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  // Marca uso — fire-and-forget, nunca atrasa a resposta
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { projectId: apiKey.projectId, apiKeyId: apiKey.id };
}
