import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { linksRepository } from "@/modules/links/links.repository";
import { trackingService } from "@/modules/tracking/tracking.service";

// ============================================================
// GET /r/[slug] — O CORAÇÃO DO TRACKING
//
// Prioridades, nesta ordem:
// 1. Redirecionar RÁPIDO (o registro do clique nunca bloqueia)
// 2. Preservar parâmetros dinâmicos (ex: macros do Meta Ads)
// 3. Plantar o visitor_id que ligará clique → conversão
// ============================================================

const VISITOR_COOKIE = "uvid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

type Params = { params: { slug: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const link = await linksRepository.findBySlug(params.slug);

  // Link inexistente ou pausado → manda para a home (nunca erro feio para o visitante)
  if (!link || link.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  // --- Monta a URL de destino ---
  const destination = new URL(link.destinationUrl);
  const incoming = request.nextUrl.searchParams;

  // UTMs fixas do link entram como reserva...
  const fallbacks: Record<string, string | null> = {
    utm_source: link.utmSource,
    utm_medium: link.utmMedium,
    utm_campaign: link.utmCampaign,
    utm_term: link.utmTerm,
    utm_content: link.utmContent,
  };
  for (const [key, value] of Object.entries(fallbacks)) {
    if (value && !destination.searchParams.has(key)) {
      destination.searchParams.set(key, value);
    }
  }

  // ...e TUDO que chega na URL tem prioridade (macros do Meta já resolvidos,
  // fbclid, gclid, qualquer parâmetro extra — nada se perde).
  incoming.forEach((value, key) => {
    destination.searchParams.set(key, value);
  });

  // --- Visitor ID (cookie first-party, 1 ano) ---
  const existingVisitor = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitor ?? randomUUID();

  // Repassa o visitor id ao destino: o checkout pode capturá-lo e
  // devolvê-lo no webhook de conversão (atribuição da Fase 3).
  destination.searchParams.set("uclid", visitorId);

  // Kiwify: o parâmetro "sck" é preservado no checkout e devolvido
  // no webhook (TrackingParameters.sck) → é a ponte clique→venda.
  // Só definimos se o anunciante não estiver usando sck para outra coisa.
  if (!destination.searchParams.has("sck")) {
    destination.searchParams.set("sck", visitorId);
  }

  // --- Registro do clique: fire-and-forget ---
  // Sem await: o visitante não espera o banco.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");

  trackingService
    .recordClick({
      utmLinkId: link.id,
      projectId: link.projectId,
      visitorId,
      ip,
      userAgent: request.headers.get("user-agent"),
      country: request.headers.get("x-vercel-ip-country"), // presente em prod
      referer: request.headers.get("referer"),
    })
    .catch((err) => console.error("[tracking:click]", err));

  // --- Redirect imediato ---
  const response = NextResponse.redirect(destination, 302);
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
