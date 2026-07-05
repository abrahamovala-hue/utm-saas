import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Raiz do site: manda cada um para o lugar certo.
export default async function HomePage() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/login");
}
