"use client";

import { useState } from "react";
import { Button, Input, Label, Hint, ErrorBox } from "@/components/ui/controls";

type UtmLink = {
  id: string;
  slug: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  status: string;
  createdAt: string;
  _count: { clicks: number };
};

type Props = {
  projectId: string;
  appUrl: string;
  initialLinks: UtmLink[];
};

const META_MACROS =
  "utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}";

export function LinksManager({ projectId, appUrl, initialLinks }: Props) {
  const [links, setLinks] = useState<UtmLink[]>(initialLinks);
  const [showForm, setShowForm] = useState(initialLinks.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function createLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/v1/projects/${projectId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationUrl: form.get("destinationUrl"),
        utmCampaign: form.get("utmCampaign") || "sem-campanha",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar o link");
      return;
    }

    const { link } = await res.json();
    setLinks((prev) => [{ ...link, _count: { clicks: 0 } }, ...prev]);
    setShowForm(false);
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)}>+ Novo link rastreável</Button>
      )}

      {showForm && (
        <form
          onSubmit={createLink}
          className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
        >
          <div>
            <Label htmlFor="destinationUrl">URL de destino</Label>
            <Input
              id="destinationUrl"
              name="destinationUrl"
              type="url"
              required
              placeholder="https://pay.kiwify.com.br/seu-produto"
            />
            <Hint>Para onde o visitante será enviado (página de vendas, checkout...)</Hint>
          </div>

          <div>
            <Label htmlFor="utmCampaign">
              Nome da campanha <span className="font-normal text-ink-faint">(opcional)</span>
            </Label>
            <Input
              id="utmCampaign"
              name="utmCampaign"
              type="text"
              placeholder="Ex: lancamento-recheios"
            />
            <Hint>
              Usado quando o clique não trouxer UTMs próprias. No Meta Ads, os
              macros dinâmicos têm prioridade automática.
            </Hint>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar link"}
            </Button>
            {links.length > 0 && (
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      {links.length > 0 && (
        <ul className="space-y-3">
          {links.map((link) => {
            const shortUrl = `${appUrl}/r/${link.slug}`;
            const metaUrl = `${shortUrl}?${META_MACROS}`;
            return (
              <li
                key={link.id}
                className="rounded-2xl border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {link.utmCampaign}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">
                      → {link.destinationUrl}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-porcelain px-3 py-1 font-display text-sm font-medium text-ink">
                    {link._count.clicks}{" "}
                    <span className="font-sans text-xs text-ink-faint">
                      {link._count.clicks === 1 ? "clique" : "cliques"}
                    </span>
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-porcelain px-3 py-2 text-xs text-ink-soft">
                      {shortUrl}
                    </code>
                    <Button
                      variant="secondary"
                      className="min-h-9 shrink-0 px-3 py-1.5 text-xs"
                      onClick={() => copy(shortUrl, link.id)}
                    >
                      {copiedId === link.id ? "✓ Copiado" : "Copiar"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-forest-50 px-3 py-2 text-xs text-forest-600">
                      {metaUrl}
                    </code>
                    <Button
                      variant="secondary"
                      className="min-h-9 shrink-0 border-forest-100 px-3 py-1.5 text-xs text-forest-600 hover:bg-forest-50"
                      onClick={() => copy(metaUrl, `meta-${link.id}`)}
                    >
                      {copiedId === `meta-${link.id}` ? "✓ Copiado" : "Copiar p/ Meta Ads"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
