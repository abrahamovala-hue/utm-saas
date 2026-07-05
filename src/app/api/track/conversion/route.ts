import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";
import { conversionInputSchema } from "@/modules/tracking/conversions.schemas";
import { conversionsService } from "@/modules/tracking/conversions.service";

// ============================================================
// POST /api/track/conversion
//
// API genérica de conversões — qualquer sistema pode integrar.
// Autenticação: header "x-api-key: utm_xxxx"
//
// Exemplo:
// curl -X POST https://SEU-APP/api/track/conversion \
//   -H "x-api-key: utm_xxxx" \
//   -H "Content-Type: application/json" \
//   -d '{"external_id":"pedido-123","value":197.00,"visitor_id":"uuid-do-clique"}'
// ============================================================

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Chave de API inválida" }, { status: 401 });
  }

  const limit = rateLimit(`conversion:${auth.apiKeyId}`, 120, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente em instantes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = conversionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const d = parsed.data;
    const result = await conversionsService.processConversion(auth.projectId, {
      externalId: d.external_id,
      eventName: d.event_name,
      value: d.value ?? null,
      currency: d.currency,
      status: d.status,
      visitorId: d.visitor_id ?? null,
      convertedAt: d.converted_at ?? new Date(),
      metadata: { source: "api", ...(d.metadata ?? {}) },
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    console.error("[conversion]", err);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
