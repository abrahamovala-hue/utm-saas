import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { reportsService, type ReportPeriod } from "@/modules/reports/reports.service";
import { ProjectNotFoundError } from "@/modules/projects/projects.service";

type Props = {
  params: { projectId: string };
  searchParams: { periodo?: string };
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function pct(value: number | null) {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

export default async function ReportPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const days: ReportPeriod = searchParams.periodo === "30" ? 30 : 7;

  let report;
  try {
    report = await reportsService.getProjectReport(
      session.user.id,
      params.projectId,
      days
    );
  } catch (err) {
    if (err instanceof ProjectNotFoundError) notFound();
    throw err;
  }

  const { totals, daily, byCampaign, project } = report;
  const maxClicks = Math.max(...daily.map((d) => d.clicks), 1);

  // Cards-assinatura: número em serifa, label em versalete, fio dourado
  const cards = [
    { label: "Cliques", value: totals.clicks.toLocaleString("pt-BR") },
    { label: "Conversões", value: totals.conversions.toLocaleString("pt-BR") },
    { label: "Taxa de conversão", value: pct(totals.conversionRate) },
    { label: "Receita", value: money(totals.revenue, project.currency), highlight: true },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/projects/${params.projectId}`}
            className="text-xs text-ink-faint transition-colors duration-200 hover:text-ink"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
            Relatório
          </h1>
        </div>

        <div
          className="flex gap-1 rounded-lg border border-line bg-surface p-1"
          role="group"
          aria-label="Período do relatório"
        >
          {[7, 30].map((p) => (
            <Link
              key={p}
              href={`/projects/${params.projectId}/relatorio?periodo=${p}`}
              aria-current={days === p ? "page" : undefined}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                days === p
                  ? "bg-forest-500 text-white"
                  : "text-ink-soft hover:bg-porcelain hover:text-ink"
              }`}
            >
              {p} dias
            </Link>
          ))}
        </div>
      </div>

      {/* Cards de métricas — a assinatura visual do produto */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-line bg-surface p-5 shadow-card"
          >
            <div
              className={`h-px w-8 ${card.highlight ? "bg-gold-400" : "bg-line"}`}
              aria-hidden
            />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-ink-faint">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {(totals.unattributed > 0 || totals.refundedValue > 0) && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-faint">
          {totals.unattributed > 0 && (
            <span>
              {totals.unattributed}{" "}
              {totals.unattributed === 1
                ? "conversão não atribuída"
                : "conversões não atribuídas"}{" "}
              (sem clique de origem identificado)
            </span>
          )}
          {totals.refundedValue > 0 && (
            <span className="text-wine-600">
              {money(totals.refundedValue, project.currency)} em reembolsos (fora
              da receita)
            </span>
          )}
        </div>
      )}

      {/* Evolução diária */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-medium text-ink">
          Evolução diária
        </h2>
        <div className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <div className="flex h-40 items-end gap-1">
            {daily.map((day) => (
              <div
                key={day.date}
                className="group relative flex flex-1 flex-col items-center justify-end gap-1"
                title={`${day.date}: ${day.clicks} cliques, ${day.conversions} conversões`}
              >
                {day.conversions > 0 && (
                  <div className="h-1.5 w-full max-w-6 rounded-full bg-gold-400" />
                )}
                <div
                  className="w-full max-w-6 rounded-t bg-forest-500 transition-colors duration-200 group-hover:bg-forest-600"
                  style={{
                    height: `${Math.max((day.clicks / maxClicks) * 100, day.clicks > 0 ? 4 : 0)}%`,
                  }}
                />
                <div className="pointer-events-none absolute -top-10 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-porcelain group-hover:block">
                  {day.clicks} cliques · {day.conversions} conv.
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-ink-faint">
            <span>{daily[0]?.date.split("-").reverse().slice(0, 2).join("/")}</span>
            <span>
              {daily[daily.length - 1]?.date.split("-").reverse().slice(0, 2).join("/")}
            </span>
          </div>
          <div className="mt-4 flex gap-5 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-forest-500" aria-hidden />
              Cliques
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-gold-400" aria-hidden />
              Dias com conversão
            </span>
          </div>
        </div>
      </section>

      {/* Por campanha */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-medium text-ink">Por campanha</h2>
        {byCampaign.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="font-display text-base text-ink">Sem dados no período</p>
            <p className="mt-2 text-sm text-ink-soft">
              Compartilhe seus links rastreáveis para começar.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
                  <th className="px-5 py-3.5 font-medium">Campanha</th>
                  <th className="px-5 py-3.5 text-right font-medium">Cliques</th>
                  <th className="px-5 py-3.5 text-right font-medium">Conversões</th>
                  <th className="px-5 py-3.5 text-right font-medium">Taxa</th>
                  <th className="px-5 py-3.5 text-right font-medium">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byCampaign.map((c) => (
                  <tr
                    key={c.name}
                    className="transition-colors duration-200 hover:bg-porcelain"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {c.name === "não atribuída" ? (
                        <span className="italic text-ink-faint">{c.name}</span>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-soft">
                      {c.clicks.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-soft">
                      {c.conversions.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-soft">
                      {pct(c.conversionRate)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-display text-base font-medium text-ink">
                      {money(c.revenue, project.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
