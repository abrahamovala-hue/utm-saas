import { reportsRepository } from "./reports.repository";
import { projectsService } from "@/modules/projects/projects.service";
import { fetchMetaSpend } from "@/lib/meta-ads";

// ============================================================
// RELATÓRIO DENSO — todas as métricas do painel.
//
// Fontes da verdade:
//   Conversões e receita → Kiwify (via webhook)
//   Gasto com anúncios   → Meta Ads API
//   ROAS/ROI/Lucro/Margem → cruzamento dos dois
// ============================================================

export type ReportPeriod = 7 | 30;

const NOT_ATTRIBUTED = "não atribuída";

type ConversionMeta = {
  product?: string | null;
  utms?: { utm_source?: string | null };
  raw?: {
    payment_method?: string;
    order_status?: string;
    webhook_event_type?: string;
  };
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
};

function dayKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

function paymentLabel(raw?: string): string {
  if (!raw) return "Outros";
  return PAYMENT_LABELS[raw] ?? "Outros";
}

export const reportsService = {
  async getProjectReport(
    userId: string,
    projectId: string,
    days: ReportPeriod,
    productFilter?: string | null
  ) {
    const project = await projectsService.getProject(userId, projectId);
    const tz = project.timezone;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [clicks, allConversions, metaSpend] = await Promise.all([
      reportsRepository.findClicksSince(projectId, since),
      reportsRepository.findConversionsSince(projectId, since),
      fetchMetaSpend(days),
    ]);

    // Lista de produtos disponíveis (para o filtro) — antes de filtrar
    const productsAvailable = Array.from(
      new Set(
        allConversions
          .map((c) => (c.metadata as ConversionMeta | null)?.product)
          .filter((p): p is string => !!p)
      )
    ).sort();

    const conversions = productFilter
      ? allConversions.filter(
          (c) => (c.metadata as ConversionMeta | null)?.product === productFilter
        )
      : allConversions;

    const approved = conversions.filter((c) => c.status === "APPROVED");
    const pending = conversions.filter((c) => c.status === "PENDING");
    const refunded = conversions.filter((c) => c.status === "REFUNDED");
    const rejected = conversions.filter((c) => c.status === "REJECTED");

    const sum = (list: typeof conversions) =>
      list.reduce((acc, c) => acc + Number(c.value ?? 0), 0);

    // --- Núcleo financeiro ---
    const netRevenue = sum(approved); // Faturamento Líquido (reembolsos já saíram via status)
    const pendingValue = sum(pending);
    const refundedValue = sum(refunded);

    const spend = metaSpend?.spend ?? null;
    const roas = spend && spend > 0 ? netRevenue / spend : null;
    const profit = spend !== null ? netRevenue - spend : null;
    const roi = spend && spend > 0 && profit !== null ? profit / spend : null;
    const margin =
      profit !== null && netRevenue > 0 ? profit / netRevenue : null;

    // --- Taxas ---
    const settled = approved.length + refunded.length;
    const refundRate = settled > 0 ? refunded.length / settled : null;

    const chargebacks = conversions.filter((c) => {
      const raw = (c.metadata as ConversionMeta | null)?.raw;
      const s = `${raw?.order_status ?? ""} ${raw?.webhook_event_type ?? ""}`;
      return /charge(d)?back/i.test(s);
    });
    const chargebackRate = settled > 0 ? chargebacks.length / settled : null;

    // --- Taxa de aprovação por método de pagamento ---
    const approvalByMethod = new Map<string, { approved: number; total: number }>();
    for (const c of conversions) {
      const method = paymentLabel(
        (c.metadata as ConversionMeta | null)?.raw?.payment_method
      );
      const bucket = approvalByMethod.get(method) ?? { approved: 0, total: 0 };
      bucket.total++;
      if (c.status === "APPROVED") bucket.approved++;
      approvalByMethod.set(method, bucket);
    }
    const approvalRates = ["Cartão", "Pix", "Boleto"].map((method) => {
      const bucket = approvalByMethod.get(method);
      return {
        method,
        rate: bucket && bucket.total > 0 ? bucket.approved / bucket.total : null,
      };
    });

    // --- Vendas por produto (aprovadas) ---
    const byProduct = new Map<string, { count: number; revenue: number }>();
    for (const c of approved) {
      const name =
        (c.metadata as ConversionMeta | null)?.product ?? "Sem produto";
      const bucket = byProduct.get(name) ?? { count: 0, revenue: 0 };
      bucket.count++;
      bucket.revenue += Number(c.value ?? 0);
      byProduct.set(name, bucket);
    }
    const salesByProduct = Array.from(byProduct.entries())
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue);

    // --- Vendas por pagamento (aprovadas, para a rosca) ---
    const byPayment = new Map<string, number>();
    for (const c of approved) {
      const method = paymentLabel(
        (c.metadata as ConversionMeta | null)?.raw?.payment_method
      );
      byPayment.set(method, (byPayment.get(method) ?? 0) + 1);
    }
    const salesByPayment = Array.from(byPayment.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);

    // --- Vendas por fonte ---
    const bySource = new Map<string, { count: number; revenue: number }>();
    for (const c of approved) {
      const meta = c.metadata as ConversionMeta | null;
      const source =
        c.click?.utmLink?.utmSource ?? meta?.utms?.utm_source ?? NOT_ATTRIBUTED;
      const bucket = bySource.get(source) ?? { count: 0, revenue: 0 };
      bucket.count++;
      bucket.revenue += Number(c.value ?? 0);
      bySource.set(source, bucket);
    }
    const salesBySource = Array.from(bySource.entries())
      .map(([source, s]) => ({ source, ...s }))
      .sort((a, b) => b.revenue - a.revenue);

    // --- Série diária ---
    const byDay = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.set(dayKey(d, tz), { clicks: 0, conversions: 0, revenue: 0 });
    }
    for (const click of clicks) {
      const bucket = byDay.get(dayKey(click.clickedAt, tz));
      if (bucket) bucket.clicks++;
    }
    for (const conv of approved) {
      const bucket = byDay.get(dayKey(conv.convertedAt, tz));
      if (bucket) {
        bucket.conversions++;
        bucket.revenue += Number(conv.value ?? 0);
      }
    }
    // Gasto diário do Meta entra na mesma série (match por data)
    const spendByDate = new Map(
      (metaSpend?.daily ?? []).map((d) => [d.date, d.spend])
    );
    const daily = Array.from(byDay.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      spend: spendByDate.get(date) ?? 0,
    }));

    // --- Por campanha ---
    const campaigns = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    const campaignBucket = (name: string) => {
      if (!campaigns.has(name)) campaigns.set(name, { clicks: 0, conversions: 0, revenue: 0 });
      return campaigns.get(name)!;
    };
    for (const click of clicks) campaignBucket(click.utmLink.utmCampaign).clicks++;
    for (const conv of approved) {
      const name = conv.click?.utmLink?.utmCampaign ?? NOT_ATTRIBUTED;
      const bucket = campaignBucket(name);
      bucket.conversions++;
      bucket.revenue += Number(conv.value ?? 0);
    }
    const byCampaign = Array.from(campaigns.entries())
      .map(([name, s]) => ({
        name,
        ...s,
        conversionRate: s.clicks > 0 ? s.conversions / s.clicks : null,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks);

    return {
      project: { name: project.name, currency: project.currency, timezone: tz },
      period: days,
      productFilter: productFilter ?? null,
      productsAvailable,
      metaConnected: metaSpend !== null,
      finance: {
        netRevenue,
        spend,
        roas,
        profit,
        roi,
        margin,
        pendingValue,
        pendingCount: pending.length,
        refundedValue,
        refundRate,
        chargebackRate,
        rejectedCount: rejected.length,
      },
      approvalRates,
      salesByProduct,
      salesByPayment,
      salesBySource,
      totals: {
        clicks: clicks.length,
        conversions: approved.length,
        conversionRate: clicks.length > 0 ? approved.length / clicks.length : 0,
        unattributed: approved.filter((c) => !c.click).length,
      },
      daily,
      byCampaign,
    };
  },
};
