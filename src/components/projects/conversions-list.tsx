type ConversionItem = {
  id: string;
  externalId: string | null;
  eventName: string;
  value: unknown;
  currency: string;
  status: string;
  convertedAt: Date | string;
  metadata: unknown;
  click: { utmLink: { utmCampaign: string; slug: string } | null } | null;
};

const STATUS_LABEL: Record<string, { text: string; classes: string }> = {
  APPROVED: { text: "Aprovada", classes: "bg-forest-50 text-forest-600" },
  PENDING: { text: "Pendente", classes: "bg-amber-50 text-amber-700" },
  REFUNDED: { text: "Reembolsada", classes: "bg-wine-50 text-wine-600" },
  REJECTED: { text: "Recusada", classes: "bg-porcelain text-ink-faint" },
};

function formatMoney(value: unknown, currency: string) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);
}

export function ConversionsList({ conversions }: { conversions: ConversionItem[] }) {
  if (conversions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
        <p className="font-display text-base text-ink">
          Nenhuma conversão registrada ainda
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Configure o webhook do seu checkout apontando para{" "}
          <code className="rounded bg-porcelain px-1.5 py-0.5 text-xs text-ink">
            /api/track/kiwify?key=SUA_CHAVE
          </code>
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {conversions.map((c) => {
        const status = STATUS_LABEL[c.status] ?? STATUS_LABEL.PENDING;
        const meta = (c.metadata ?? {}) as { product?: string };
        const campaign = c.click?.utmLink?.utmCampaign;

        return (
          <li
            key={c.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-porcelain"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {meta.product ?? c.eventName}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${status.classes}`}
                >
                  {status.text}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">
                {campaign ? (
                  <>
                    via <span className="text-ink-soft">{campaign}</span>
                  </>
                ) : (
                  <span className="italic">não atribuída</span>
                )}
                {" · "}
                {new Date(c.convertedAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="shrink-0 font-display text-base font-medium text-ink">
              {formatMoney(c.value, c.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
