"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONES, CURRENCIES } from "@/modules/projects/projects.schemas";
import { Button, Input, Select, Label, Hint, ErrorBox } from "@/components/ui/controls";

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        timezone: form.get("timezone"),
        currency: form.get("currency"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar o projeto");
      setLoading(false);
      return;
    }

    const { project } = await res.json();
    router.push(`/projects/${project.id}`);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-ink-faint">
        Novo projeto
      </p>
      <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
        Comece um rastreamento
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Um projeto representa um negócio ou site que você quer acompanhar.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card"
      >
        <div>
          <Label htmlFor="name">Nome do projeto</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            placeholder="Ex: Minha Loja"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone">Fuso horário</Label>
            <Select id="timezone" name="timezone" defaultValue="America/Sao_Paulo">
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Hint>Define o "dia" dos relatórios</Hint>
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select id="currency" name="currency" defaultValue="BRL">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : "Criar projeto"}
        </Button>
      </form>
    </main>
  );
}
