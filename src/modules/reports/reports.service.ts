import { reportsRepository } from "./reports.repository";
import { projectsService } from "@/modules/projects/projects.service";

// ============================================================
// RELATÓRIOS — agregação por período, campanha e dia.
// O "dia" respeita o FUSO HORÁRIO DO PROJETO: uma venda às 23h
// em São Paulo pertence àquele dia, não ao dia seguinte em UTC.
// ============================================================

export type ReportPeriod = 7 | 30;

const NOT_ATTRIBUTED = "não atribuída";

function dayKey(date: Date, timezone: string): string {
  // en-CA gera YYYY-MM-DD, perfeito como chave ordenável
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

export const reportsService = {
  async getProjectReport(userId: string, projectId: string, days: ReportPeriod) {
    const project = await projectsService.getProject(userId, projectId);
    const tz = project.timezone;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [clicks, conversions] = await Promise.all([
      reportsRepository.findClicksSince(projectId, since),
      reportsRepository.findConversionsSince(projectId, since),
    ]);

    const approved = conversions.filter((c) => c.status === "APPROVED");
    const refunded = conversions.filter((c) => c.status === "REFUNDED");

    // --- Totais ---
    const totalClicks = clicks.length;
    const totalConversions = approved.length;
    const revenue = approved.reduce((sum, c) => sum + Number(c.value ?? 0), 0);
    const refundedValue = refunded.reduce((sum, c) => sum + Number(c.value ?? 0), 0);
    const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
    const unattributed = approved.filter((c) => !c.click).length;

    // --- Série diária (clicks + conversões por dia, no fuso do projeto) ---
    const byDay = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.set(dayKey(d, tz), { clicks: 0, conversions: 0, revenue: 0 });
    }
    for (const click of clicks) {
      const key = dayKey(click.clickedAt, tz);
      const bucket = byDay.get(key);
      if (bucket) bucket.clicks++;
    }
    for (const conv of approved) {
      const key = dayKey(conv.convertedAt, tz);
      const bucket = byDay.get(key);
      if (bucket) {
        bucket.conversions++;
        bucket.revenue += Number(conv.value ?? 0);
      }
    }
    const daily = Array.from(byDay.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    // --- Quebra por campanha ---
    const campaigns = new Map<
      string,
      { clicks: number; conversions: number; revenue: number }
    >();
    const bucketFor = (name: string) => {
      if (!campaigns.has(name)) {
        campaigns.set(name, { clicks: 0, conversions: 0, revenue: 0 });
      }
      return campaigns.get(name)!;
    };
    for (const click of clicks) {
      bucketFor(click.utmLink.utmCampaign).clicks++;
    }
    for (const conv of approved) {
      const name = conv.click?.utmLink?.utmCampaign ?? NOT_ATTRIBUTED;
      const bucket = bucketFor(name);
      bucket.conversions++;
      bucket.revenue += Number(conv.value ?? 0);
    }
    const byCampaign = Array.from(campaigns.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        conversionRate: stats.clicks > 0 ? stats.conversions / stats.clicks : null,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks);

    return {
      project: { name: project.name, currency: project.currency, timezone: tz },
      period: days,
      totals: {
        clicks: totalClicks,
        conversions: totalConversions,
        conversionRate,
        revenue,
        refundedValue,
        unattributed,
      },
      daily,
      byCampaign,
    };
  },
};
