import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Middleware de proteção de rotas (Edge Runtime).
// Usa apenas a config edge-safe — sem banco, sem bcrypt.

export default NextAuth(authConfig).auth;

export const config = {
  // Protege tudo, EXCETO:
  // - /api (as rotas de API têm sua própria autenticação)
  // - /r (redirects públicos de tracking — Fase 2; latência é sagrada aqui)
  // - assets estáticos do Next
  matcher: ["/((?!api|r/|_next/static|_next/image|favicon.ico).*)"],
};
