import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/crypto";

// ============================================================
// POST /api/track/event — eventos do site (page_view etc.)
//
// Endpoint PÚBLICO (chamado pelo navegador do visitante — não
// pode exigir API key, que ficaria exposta no código do site).
// Proteções: projeto precisa existir + rate limit por IP+projeto.
// Alimenta a tabela events (base de funil e fonte de visitas).
// ============================================================

const eventSchema = z.object({
  project: z.string().min(10).max(40),
  visitor_id: z.string().min(8).max(64),
  event: z.string().min(1).max(40).default("page_view"),
  page: z.string().max(300).optional(),
  params: z.record(z.string().max(300)).optional(),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    // sendBeacon envia como text/plain — parseamos manualmente
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: CORS_HEADERS });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400, headers: CORS_HEADERS });
  }
  const d = parsed.data;

  // Rate limit: 60 eventos/min por projeto+IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "sem-ip";
  const limit = rateLimit(`event:${d.project}:${sha256(ip)}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate" }, { status: 429, headers: CORS_HEADERS });
  }

  const project = await prisma.project.findUnique({
    where: { id: d.project },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Projeto inválido" }, { status: 404, headers: CORS_HEADERS });
  }

  prisma.event
    .create({
      data: {
        projectId: project.id,
        visitorId: d.visitor_id,
        eventName: d.event,
        properties: { page: d.page ?? null, ...(d.params ?? {}) },
      },
    })
    .catch((err) => console.error("[event]", err));

  return NextResponse.json({ ok: true }, { status: 202, headers: CORS_HEADERS });
}
