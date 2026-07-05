import type { ConversionStatus } from "@prisma/client";

// ============================================================
// Adaptador Kiwify → formato interno
//
// Parser TOLERANTE de propósito: o payload completo é sempre
// preservado em metadata (auditoria/debug), então mesmo que a
// Kiwify mude campos, nenhum dado se perde — só a extração
// automática precisaria de ajuste.
// ============================================================

type KiwifyPayload = Record<string, any>;

const STATUS_MAP: Record<string, ConversionStatus> = {
  // order_status / webhook_event_type conhecidos
  paid: "APPROVED",
  approved: "APPROVED",
  order_approved: "APPROVED",
  refunded: "REFUNDED",
  order_refunded: "REFUNDED",
  chargedback: "REFUNDED",
  chargeback: "REFUNDED",
  waiting_payment: "PENDING",
  pix_created: "PENDING",
  billet_created: "PENDING",
  refused: "REJECTED",
  order_rejected: "REJECTED",
};

export function parseKiwifyWebhook(payload: KiwifyPayload) {
  // ID do pedido — tenta os campos conhecidos
  const externalId: string | null =
    payload.order_id ?? payload.order_ref ?? payload.id ?? null;

  // Status — tenta order_status, depois o tipo do evento
  const rawStatus: string =
    payload.order_status ?? payload.webhook_event_type ?? "";
  const status = STATUS_MAP[rawStatus.toLowerCase()] ?? null;

  // Valor — Kiwify envia em CENTAVOS em Commissions.charge_amount
  const cents =
    payload.Commissions?.charge_amount ??
    payload.Commissions?.product_base_price ??
    null;
  const value = typeof cents === "number" ? cents / 100 : null;

  const currency: string = payload.Commissions?.currency ?? "BRL";

  // Rastreamento — o Kiwify devolve os parâmetros do checkout aqui.
  // Nosso redirect embute o visitor_id no parâmetro "sck".
  const tracking = payload.TrackingParameters ?? {};
  const visitorId: string | null = tracking.sck ?? tracking.src ?? null;

  const productName: string | null = payload.Product?.product_name ?? null;

  return {
    externalId,
    status,
    rawStatus,
    value,
    currency,
    visitorId,
    productName,
    utms: {
      utm_source: tracking.utm_source ?? null,
      utm_medium: tracking.utm_medium ?? null,
      utm_campaign: tracking.utm_campaign ?? null,
      utm_term: tracking.utm_term ?? null,
      utm_content: tracking.utm_content ?? null,
    },
  };
}
