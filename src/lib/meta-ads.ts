// ============================================================
// Integração Meta Ads — busca o GASTO da conta de anúncios.
//
// Configuração (variáveis de ambiente):
//   META_ACCESS_TOKEN   → token com permissão ads_read
//   META_AD_ACCOUNT_ID  → ID numérico da conta (sem o "act_")
//
// Sem as variáveis configuradas, retorna null e os cards de
// ROAS/Lucro exibem "—" com a dica de conexão.
//
// A receita NUNCA vem daqui — conversões reais são só do Kiwify.
// O Meta fornece apenas o CUSTO; o cruzamento é nosso.
// ============================================================

const GRAPH_VERSION = "v21.0";

export type MetaSpend = {
  spend: number;
  currency: string | null;
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
    `&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) {
      console.error("[meta-ads] resposta não-ok:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      data?: Array<{ spend?: string; account_currency?: string }>;
    };

    const row = json.data?.[0];
    if (!row) return { spend: 0, currency: null }; // sem gasto no período

    return {
      spend: Number(row.spend ?? 0),
      currency: row.account_currency ?? null,
    };
  } catch (err) {
    console.error("[meta-ads]", err);
    return null;
  }
}
