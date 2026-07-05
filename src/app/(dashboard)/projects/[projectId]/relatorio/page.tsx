import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { reportsService, type ReportPeriod } from "@/modules/reports/reports.service";
import { ProjectNotFoundError } from "@/modules/projects/projects.service";

// ============================================================
// RELATÓRIO — tema escuro denso (estilo painel de mídia).
// Conversões/receita: Kiwify. Gasto: Meta Ads. ROAS: cruzamento.
// ============================================================

type Props = {
  params: { projectId: string };
  searchParams: { periodo?: string; produto?: string };
};

function money(value: number | null, currency: string) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function pct(value: number | null) {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function ratio(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(2).replace(".", ",");
}

const PAYMENT_COLORS: Record<string, string> = {
  "Cartão": "#5B8DEF",
  "Pix": "#34C98E",
  "Boleto": "#D6B36A",
  "Outros": "#6E7689",
};

function Donut({ segments }: { segments: { label: string; count: number }[] }) {
  const total = segments.reduce((acc, s) => acc + s.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-night-faint">
        Nenhuma venda no período
      </div>
    );
  }

  const R = 56;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center justify-center gap-8">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Vendas por método de pagamento">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#232C40" strokeWidth="16" />
        {segments.map((s) => {
          const frac = s.count / total;
          const dash = frac * C;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={PAYMENT_COLORS[s.label] ?? PAYMENT_COLORS["Outros"]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fill="#E8EBF2" style={{ fontSize: 22, fontWeight: 600 }}>
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fill="#6E7689" style={{ fontSize: 10 }}>
          vendas
        </text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-night-soft">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: PAYMENT_COLORS[s.label] ?? PAYMENT_COLORS["Outros"] }}
              aria-hidden
            />
            {s.label} · {s.count}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red" | "gold";
  hint?: string;
}) {
  const toneClass =
    tone === "green"
      ? "text-night-green"
      : tone === "red"
        ? "text-night-red"
        : tone === "gold"
          ? "text-night-gold"
          : "text-night-text";

  return (
    <div className="rounded-xl border border-night-line bg-night-panel p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-night-faint">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-2xl font-medium tracking-tight ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-night-faint">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-night-line bg-night-panel p-5">
      <h3 className="text-sm font-semibold text-night-text">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function ReportPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const days: ReportPeriod = searchParams.periodo === "30" ? 30 : 7;
  const productFilter = searchParams.produto || null;

  let report;
  try {
    report = await reportsService.getProjectReport(
      session.user.id,
      params.projectId,
      days,
      productFilter
    );
  } catch (err) {
    if (err instanceof ProjectNotFoundError) notFound();
    throw err;
  }

  const {
    finance,
    approvalRates,
    salesByProduct,
    salesByPayment,
    salesBySource,
    totals,
    daily,
    byCampaign,
    project,
    productsAvailable,
    metaConnected,
  } = report;
  const cur = project.currency;
  const maxClicks = Math.max(...daily.map((d) => d.clicks), 1);
  const metaHint = metaConnected ? undefined : "conecte o Meta Ads";

  return (
    <main className="min-h-screen bg-night-bg px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href={`/projects/${params.projectId}`}
              className="text-xs text-night-faint transition-colors duration-200 hover:text-night-soft"
            >
              ← {project.name}
            </Link>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-night-text">
              Resumo
            </h1>
          </div>
        </div>

        {/* Filtros */}
        <form
          method="get"
          className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-night-line bg-night-panel p-4"
        >
          <div>
            <label
              htmlFor="periodo"
              className="block text-[11px] font-medium uppercase tracking-wide text-night-faint"
            >
              Período
            </label>
            <select
              id="periodo"
              name="periodo"
              defaultValue={String(days)}
              className="mt-1 cursor-pointer rounded-lg border border-night-line bg-night-raised px-3 py-2 text-sm text-night-text focus:border-night-blue focus:outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="produto"
              className="block text-[11px] font-medium uppercase tracking-wide text-night-faint"
            >
              Produto
            </label>
            <select
              id="produto"
              name="produto"
              defaultValue={productFilter ?? ""}
              className="mt-1 cursor-pointer rounded-lg border border-night-line bg-night-raised px-3 py-2 text-sm text-night-text focus:border-night-blue focus:outline-none"
            >
              <option value="">Qualquer</option>
              {productsAvailable.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-night-faint">
              Plataforma
            </span>
            <span className="mt-1 inline-block rounded-lg border border-night-line bg-night-raised px-3 py-2 text-sm text-night-soft">
              Kiwify
            </span>
          </div>

          <button
            type="submit"
            className="ml-auto cursor-pointer rounded-lg bg-night-blue px-4 py-2 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          >
            Atualizar
          </button>
        </form>

        {/* Linha principal */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Faturamento Líquido" value={money(finance.netRevenue, cur)} tone="green" />
          <Metric label="Gastos com Anúncios" value={money(finance.spend, cur)} hint={metaHint} />
          <Metric
            label="ROAS"
            value={ratio(finance.roas)}
            tone={finance.roas === null ? "neutral" : finance.roas >= 1 ? "green" : "red"}
            hint={metaHint}
          />
          <Metric
            label="Lucro"
            value={money(finance.profit, cur)}
            tone={finance.profit === null ? "neutral" : finance.profit >= 0 ? "green" : "red"}
            hint={metaHint}
          />
        </div>

        {/* Grade secundária */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Metric
            label="ROI"
            value={pct(finance.roi)}
            tone={finance.roi === null ? "neutral" : finance.roi >= 0 ? "green" : "red"}
          />
          <Metric label="Margem" value={pct(finance.margin)} />
          <Metric
            label="Vendas Pendentes"
            value={money(finance.pendingValue, cur)}
            hint={`${finance.pendingCount} ${finance.pendingCount === 1 ? "pedido" : "pedidos"}`}
          />
          <Metric
            label="Vendas Reembolsadas"
            value={money(finance.refundedValue, cur)}
            tone={finance.refundedValue > 0 ? "red" : "neutral"}
          />
          <Metric label="Reembolso" value={pct(finance.refundRate)} />
          <Metric label="Chargeback" value={pct(finance.chargebackRate)} />
        </div>

        {/* Painéis */}
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <Panel title="Vendas por Produto">
            {salesByProduct.length === 0 ? (
              <p className="text-sm text-night-faint">Nenhuma venda por aqui</p>
            ) : (
              <ul className="space-y-2.5">
                {salesByProduct.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-night-soft">{p.name}</span>
                    <span className="shrink-0 text-night-text">
                      {p.count} ·{" "}
                      <span className="text-night-green">{money(p.revenue, cur)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Vendas por Pagamento">
            <Donut segments={salesByPayment.map((s) => ({ label: s.method, count: s.count }))} />
          </Panel>

          <div className="space-y-3">
            <Panel title="Taxa de Aprovação">
              <ul className="space-y-2.5">
                {approvalRates.map((r) => (
                  <li key={r.method} className="flex items-center justify-between text-sm">
                    <span className="text-night-soft">{r.method}</span>
                    <span className={r.rate === null ? "text-night-faint" : "text-night-text"}>
                      {r.rate === null ? "N/A" : pct(r.rate)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Vendas por Fonte">
              {salesBySource.length === 0 ? (
                <p className="text-sm text-night-faint">Nenhuma venda por aqui</p>
              ) : (
                <ul className="space-y-2.5">
                  {salesBySource.map((s) => (
                    <li key={s.source} className="flex items-center justify-between gap-3 text-sm">
                      <span
                        className={`min-w-0 truncate ${
                          s.source === "não atribuída"
                            ? "italic text-night-faint"
                            : "text-night-soft"
                        }`}
                      >
                        {s.source}
                      </span>
                      <span className="shrink-0 text-night-text">
                        {s.count} ·{" "}
                        <span className="text-night-green">{money(s.revenue, cur)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        {/* Evolução diária — Receita vs Gasto */}
        <div className="mt-5 rounded-xl border border-night-line bg-night-panel p-5">
          <h3 className="text-sm font-semibold text-night-text">
            Receita vs Gasto por dia{" "}
            <span className="ml-2 text-[11px] font-normal text-night-faint">
              {totals.clicks} cliques · {totals.conversions} conversões · taxa{" "}
              {pct(totals.conversionRate)}
              {totals.unattributed > 0 && ` · ${totals.unattributed} não atribuída(s)`}
            </span>
          </h3>
          {(() => {
            const maxDaily = Math.max(
              ...daily.map((d) => Math.max(d.revenue, d.spend)),
              1
            );
            const h = (v: number) =>
              `${Math.max((v / maxDaily) * 100, v > 0 ? 3 : 0)}%`;
            return (
              <>
                <div className="mt-4 flex h-40 items-end gap-1.5">
                  {daily.map((day) => {
                    const dayProfit = day.revenue - day.spend;
                    return (
                      <div
                        key={day.date}
                        className="group relative flex flex-1 items-end justify-center gap-0.5"
                        title={`${day.date}`}
                      >
                        <div
                          className="w-1/2 max-w-4 rounded-t bg-night-green/90 transition-colors duration-200 group-hover:bg-night-green"
                          style={{ height: h(day.revenue) }}
                        />
                        <div
                          className="w-1/2 max-w-4 rounded-t bg-night-blue/70 transition-colors duration-200 group-hover:bg-night-blue"
                          style={{ height: h(day.spend) }}
                        />
                        <div className="pointer-events-none absolute -top-16 z-10 hidden whitespace-nowrap rounded-lg bg-night-raised px-2.5 py-1.5 text-xs text-night-text ring-1 ring-night-line group-hover:block">
                          <span className="text-night-green">
                            {money(day.revenue, cur)}
                          </span>{" "}
                          · <span className="text-night-blue">{money(day.spend, cur)}</span>
                          <br />
                          <span className={dayProfit >= 0 ? "text-night-green" : "text-night-red"}>
                            {dayProfit >= 0 ? "+" : ""}
                            {money(dayProfit, cur)}
                          </span>{" "}
                          · {day.clicks} cliques · {day.conversions} conv.
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-night-faint">
                  <span>{daily[0]?.date.split("-").reverse().slice(0, 2).join("/")}</span>
                  <span>
                    {daily[daily.length - 1]?.date.split("-").reverse().slice(0, 2).join("/")}
                  </span>
                </div>
                <div className="mt-3 flex gap-5 text-xs text-night-soft">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-night-green" aria-hidden />
                    Receita (Kiwify)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-night-blue" aria-hidden />
                    Gasto (Meta)
                  </span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Por campanha */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-night-line bg-night-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-night-line text-left text-[11px] uppercase tracking-[0.12em] text-night-faint">
                <th className="px-5 py-3 font-medium">Campanha</th>
                <th className="px-5 py-3 text-right font-medium">Cliques</th>
                <th className="px-5 py-3 text-right font-medium">Conversões</th>
                <th className="px-5 py-3 text-right font-medium">Taxa</th>
                <th className="px-5 py-3 text-right font-medium">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-line">
              {byCampaign.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-night-faint">
                    Sem dados no período
                  </td>
                </tr>
              ) : (
                byCampaign.map((c) => (
                  <tr
                    key={c.name}
                    className="transition-colors duration-200 hover:bg-night-raised"
                  >
                    <td className="px-5 py-3 text-night-text">
                      {c.name === "não atribuída" ? (
                        <span className="italic text-night-faint">{c.name}</span>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-night-soft">
                      {c.clicks.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right text-night-soft">
                      {c.conversions.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right text-night-soft">
                      {pct(c.conversionRate)}
                    </td>
                    <td className="px-5 py-3 text-right font-display font-medium text-night-green">
                      {money(c.revenue, cur)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
