// ============================================================
// Integração Meta Ads — gasto da conta (total + diário).
//
// Config (env): META_ACCESS_TOKEN (ads_read) e META_AD_ACCOUNT_ID.
// Sem config → null → cards mostram "—" com dica.
//
// Receita NUNCA vem daqui (Kiwify é a verdade). O Meta dá o CUSTO.
// Nota: as datas diárias seguem o fuso da CONTA DE ANÚNCIOS —
// mantenha a conta e o projeto no mesmo fuso para o gráfico casar.
// ============================================================

const GRAPH_VERSION = "v21.0";

export type MetaSpend = {
  spend: number;
  currency: string | null;
  daily: { date: string; spend: number }[]; // date: YYYY-MM-DD
};

export async function fetchMetaSpend(days: 7 | 30): Promise<MetaSpend | null> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) return null;

  const preset = days === 30 ? "last_30d" : "last_7d";
  const account = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${account}/insights` +
    `?fields=spend,account_currency&date_preset=${preset}` +
    `&time_increment=1&limit=100` + // uma linha por dia
    `&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) {
      console.error("[meta-ads] resposta não-ok:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      data?: Array<{
        spend?: string;
        account_currency?: string;
        date_start?: string;
      }>;
    };

    const rows = json.data ?? [];
    const daily = rows
      .filter((r) => r.date_start)
      .map((r) => ({ date: r.date_start as string, spend: Number(r.spend ?? 0) }));

    return {
      spend: daily.reduce((acc, d) => acc + d.spend, 0),
      currency: rows[0]?.account_currency ?? null,
      daily,
    };
  } catch (err) {
    console.error("[meta-ads]", err);
    return null;
  }
}
