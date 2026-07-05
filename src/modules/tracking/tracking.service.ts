import { sha256 } from "@/lib/crypto";
import { parseUserAgent } from "@/lib/user-agent";
import { trackingRepository } from "./tracking.repository";

// Serviço de registro de cliques.
// REGRA DE OURO: nada aqui pode atrasar o redirect do visitante.
// Este serviço é chamado em fire-and-forget pela rota /r/[slug].

export type ClickContext = {
  utmLinkId: string;
  projectId: string;
  visitorId: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  referer: string | null;
};

export const trackingService = {
  async recordClick(ctx: ClickContext) {
    const ua = parseUserAgent(ctx.userAgent);

    // LGPD: o IP nunca é armazenado — apenas um hash com salt secreto.
    // Serve para detectar padrões (anti-fraude) sem identificar pessoas.
    const salt = process.env.IP_HASH_SALT ?? "";
    const ipHash = ctx.ip ? sha256(`${salt}:${ctx.ip}`) : null;

    return trackingRepository.recordClick({
      utmLinkId: ctx.utmLinkId,
      projectId: ctx.projectId,
      visitorId: ctx.visitorId,
      ipHash,
      userAgent: ctx.userAgent?.slice(0, 500) ?? null,
      deviceType: ua.deviceType,
      os: ua.os,
      browser: ua.browser,
      country: ctx.country,
      referer: ctx.referer?.slice(0, 500) ?? null,
      isBot: ua.isBot,
    });
  },
};
