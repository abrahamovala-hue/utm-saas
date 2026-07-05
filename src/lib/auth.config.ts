import type { NextAuthConfig } from "next-auth";

// Configuração base do Auth.js — SEM Prisma/bcrypt.
// Separada de auth.ts porque o middleware roda no Edge Runtime,
// que não suporta essas bibliotecas. Este arquivo é "edge-safe".

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    // Executa no middleware a cada requisição — decide quem entra onde
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) return isLoggedIn; // false → redireciona p/ /login
      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    // Coloca o id do usuário dentro do token JWT...
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    // ...e o expõe na sessão para uso nas páginas/APIs
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [], // preenchidos em auth.ts
} satisfies NextAuthConfig;
