"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Input, Label, ErrorBox } from "@/components/ui/controls";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha incorretos");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h2 className="font-display text-xl font-medium text-ink">Entrar</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Acesse sua conta para continuar
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
          />
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Não tem conta?{" "}
        <Link
          href="/register"
          className="font-semibold text-forest-500 hover:text-forest-600 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
