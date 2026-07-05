import { DefaultSession } from "next-auth";

// Extensão de tipos: garante que session.user.id existe e é string
// em todo o codebase (TypeScript estrito agradece).

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
