import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Helpers das rotas REST privadas — evitam repetição de boilerplate.

/** Retorna o userId da sessão, ou null se não autenticado. */
export async function requireUser() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Não autenticado" }, { status: 401 });

export const notFound = (msg = "Não encontrado") =>
  NextResponse.json({ error: msg }, { status: 404 });

export const badRequest = (msg = "Dados inválidos") =>
  NextResponse.json({ error: msg }, { status: 400 });

export const serverError = () =>
  NextResponse.json({ error: "Erro interno" }, { status: 500 });
