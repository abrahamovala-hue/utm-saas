import Link from "next/link";
import { auth } from "@/lib/auth";
import { projectsService } from "@/modules/projects/projects.service";

export default async function DashboardPage() {
  const session = await auth();
  const projects = session?.user?.id
    ? await projectsService.listProjects(session.user.id)
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-ink-faint">
            Seus projetos
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
            Olá, {session?.user?.name?.split(" ")[0]}
          </h1>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex min-h-10 items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-forest-600"
        >
          + Novo projeto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-display text-lg text-ink">
            Nenhum projeto por aqui ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Um projeto agrupa os links, cliques e conversões de um negócio.
            Crie o primeiro para começar.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-forest-600"
          >
            Criar primeiro projeto
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="h-px w-8 bg-gold-400 transition-all duration-200 group-hover:w-12" aria-hidden />
              <h2 className="mt-3 font-display text-xl font-medium text-ink">
                {p.name}
              </h2>
              <p className="mt-1 text-xs text-ink-faint">
                {p.currency} · {p.timezone.replace("_", " ")}
              </p>
              <p className="mt-4 text-sm text-ink-soft">
                {p._count.utmLinks}{" "}
                {p._count.utmLinks === 1 ? "link rastreável" : "links rastreáveis"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
