import { NextResponse } from "next/server";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { authService, EmailAlreadyExistsError } from "@/modules/auth/auth.service";

/**
 * POST /api/v1/auth/register
 * Cria uma nova conta de usuário.
 *
 * A rota é fina: valida com Zod, delega ao service, traduz erros em HTTP.
 * Nenhuma regra de negócio vive aqui.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const user = await authService.registerUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof EmailAlreadyExistsError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
