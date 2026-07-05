import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";
import { verifyKiwifySignature } from "@/lib/kiwify-signature";
import { parseKiwifyWebhook } from "@/modules/tracking/kiwify";
import { conversionsService } from "@/modules/tracking/conversions.service";

// ============================================================
// POST /api/track/kiwify?key=utm_xxxx[&signature=...]
//
// Camadas de proteção, nesta ordem:
// 1. API key válida e não revogada        → 401 se falhar
// 2. Rate limit (120 req/min por chave)   → 429 se exceder
// 3. Assinatura Kiwify (se token no env)  → 401 se inválida
// ============================================================

const RATE_LIMIT = 120; // requisições
const RATE_WINDOW = 60 * 1000; // por minuto

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Chave de API inválida" }, { status: 401 });
  }

  const limit = rateLimit(`kiwify:${auth.apiKeyId}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente em instantes." },
      { status: 429 }
    );
  }

  // Corpo bruto primeiro: a assinatura é calculada sobre o texto exato
  const rawBody = await request.text();

  const signature = new URL(request.url).searchParams.get("signature");
  if (!verifyKiwifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseKiwifyWebhook(payload);

  if (!parsed.externalId || !parsed.status) {
    console.warn("[kiwify] evento ignorado:", parsed.rawStatus);
    return NextResponse.json({ ignored: true, reason: "evento não tratado" });
  }

  try {
    const result = await conversionsService.processConversion(auth.projectId, {
      externalId: String(parsed.externalId),
      eventName: "purchase",
      value: parsed.value,
      currency: parsed.currency,
      status: parsed.status,
      visitorId: parsed.visitorId,
      convertedAt: new Date(),
      metadata: {
        source: "kiwify",
        product: parsed.productName,
        utms: parsed.utms,
        raw: payload,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[kiwify]", err);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
