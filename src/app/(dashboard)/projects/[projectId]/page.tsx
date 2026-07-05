import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { projectsService, ProjectNotFoundError } from "@/modules/projects/projects.service";
import { apiKeysService } from "@/modules/api-keys/api-keys.service";
import { linksService } from "@/modules/links/links.service";
import { conversionsService } from "@/modules/tracking/conversions.service";
import { ApiKeysManager } from "@/components/projects/api-keys-manager";
import { LinksManager } from "@/components/projects/links-manager";
import { ConversionsList } from "@/components/projects/conversions-list";

type Props = { params: { projectId: string } };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  let project, keys, links, conversions;
  try {
    project = await projectsService.getProject(session.user.id, params.projectId);
    [keys, links, conversions] = await Promise.all([
      apiKeysService.listKeys(session.user.id, params.projectId),
      linksService.listLinks(session.user.id, params.projectId),
      conversionsService.listConversions(session.user.id, params.projectId),
    ]);
  } catch (err) {
    if (err instanceof ProjectNotFoundError) notFound();
    throw err;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-ink-faint">
            Projeto
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            {project.currency} · {project.timezone.replace("_", " ")}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/relatorio`}
          className="inline-flex min-h-10 items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-forest-600"
        >
          Ver relatório
        </Link>
      </div>

      <Section
        title="Links rastreáveis"
        description="Use estes links nos seus anúncios — cada clique é registrado antes do redirecionamento."
      >
        <LinksManager
          projectId={project.id}
          appUrl={appUrl}
          initialLinks={JSON.parse(JSON.stringify(links))}
        />
      </Section>

      <Section
        title="Conversões recentes"
        description="Todas as vendas do seu checkout — atribuídas ou não."
      >
        <ConversionsList conversions={JSON.parse(JSON.stringify(conversions))} />
      </Section>

      <Section
        title="Chaves de API"
        description="Usadas para enviar conversões ao sistema (ex: webhook do seu checkout)."
      >
        <ApiKeysManager
          projectId={project.id}
          initialKeys={JSON.parse(JSON.stringify(keys))}
        />
      </Section>
    </main>
  );
}
