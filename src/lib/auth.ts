import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { authService } from "@/modules/auth/auth.service";

// Instância completa do Auth.js (roda no Node, pode usar Prisma/bcrypt).
// Estrutura já preparada para adicionar Google OAuth na Fase 5:
// basta importar o provider e adicioná-lo ao array abaixo.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        return authService.verifyCredentials(
          parsed.data.email,
          parsed.data.password
        );
      },
    }),
  ],
});
