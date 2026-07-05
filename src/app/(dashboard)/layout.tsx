import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

// Shell da área logada: sidebar no desktop, topbar no mobile.

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const sairForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition-colors duration-200 hover:bg-porcelain hover:text-ink"
      >
        Sair
      </button>
    </form>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 pb-6 pt-7">
          <div className="mb-3 h-px w-8 bg-gold-400" aria-hidden />
          <Link
            href="/dashboard"
            className="font-display text-lg font-medium tracking-tight text-ink"
          >
            UTM SaaS
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3" aria-label="Principal">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:bg-porcelain"
          >
            Projetos
          </Link>
        </nav>

        <div className="border-t border-line p-3">
          <p className="truncate px-3 pb-1 pt-2 text-xs text-ink-faint">
            {session?.user?.email}
          </p>
          {sairForm}
        </div>
      </aside>

      {/* Topbar — mobile */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
        <Link
          href="/dashboard"
          className="font-display text-base font-medium text-ink"
        >
          UTM SaaS
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-faint">{firstName}</span>
          {sairForm}
        </div>
      </header>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
