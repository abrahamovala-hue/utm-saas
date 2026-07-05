"use client";

import { useState } from "react";
import { Button, Input, ErrorBox } from "@/components/ui/controls";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type Props = {
  projectId: string;
  initialKeys: ApiKey[];
};

export function ApiKeysManager({ projectId, initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setFreshKey(null);

    const res = await fetch(`/api/v1/projects/${projectId}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar a chave");
      return;
    }

    const { key } = await res.json();
    setFreshKey(key.plainTextKey);
    setCopied(false);
    setNewKeyName("");
    setKeys((prev) => [
      {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        lastUsedAt: null,
        revokedAt: null,
        createdAt: key.createdAt,
      },
      ...prev,
    ]);
  }

  async function revokeKey(id: string) {
    if (!confirm("Revogar esta chave? Integrações que a usam deixarão de funcionar.")) {
      return;
    }

    const res = await fetch(`/api/v1/projects/${projectId}/api-keys/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k
        )
      );
    }
  }

  async function copyKey() {
    if (!freshKey) return;
    await navigator.clipboard.writeText(freshKey);
    setCopied(true);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createKey} className="flex gap-2">
        <Input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          required
          minLength={2}
          placeholder="Nome da chave (ex: Webhook Checkout)"
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? "Gerando..." : "Gerar chave"}
        </Button>
      </form>

      {error && <ErrorBox>{error}</ErrorBox>}

      {freshKey && (
        <div className="rounded-2xl border border-gold-400 bg-gold-100 p-5">
          <p className="text-sm font-semibold text-ink">
            Copie sua chave agora — ela não será exibida novamente
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 text-xs text-ink">
              {freshKey}
            </code>
            <Button
              variant="secondary"
              className="min-h-9 shrink-0 border-gold-600 px-3 py-1.5 text-xs text-gold-600 hover:bg-surface"
              onClick={copyKey}
            >
              {copied ? "✓ Copiada" : "Copiar"}
            </Button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-ink-faint">Nenhuma chave criada ainda.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between px-5 py-3.5 transition-colors duration-200 hover:bg-porcelain"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {k.name}
                  {k.revokedAt && (
                    <span className="ml-2 rounded-full bg-wine-50 px-2 py-0.5 text-xs font-medium text-wine-600">
                      revogada
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {k.keyPrefix}··· · criada em{" "}
                  {new Date(k.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {!k.revokedAt && (
                <button
                  onClick={() => revokeKey(k.id)}
                  className="cursor-pointer text-xs font-semibold text-wine-600 transition-colors duration-200 hover:underline"
                >
                  Revogar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
