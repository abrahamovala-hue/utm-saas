"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Input, Label, Hint, ErrorBox } from "@/components/ui/controls";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar a conta");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h2 className="font-display text-xl font-medium text-ink">Criar conta</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Comece a rastrear suas campanhas em minutos
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" type="text" required minLength={2} autoComplete="name" />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Hint>Mínimo de 8 caracteres</Hint>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-forest-500 hover:text-forest-600 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
