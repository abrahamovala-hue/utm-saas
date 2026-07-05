import { NextResponse } from "next/server";
import { createProjectSchema } from "@/modules/projects/projects.schemas";
import { projectsService } from "@/modules/projects/projects.service";
import { requireUser, unauthorized, badRequest, serverError } from "@/lib/api-helpers";

/** GET /api/v1/projects — lista projetos do usuário logado */
export async function GET() {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  try {
    const projects = await projectsService.listProjects(userId);
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[projects:list]", err);
    return serverError();
  }
}

/** POST /api/v1/projects — cria um projeto */
export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Corpo da requisição inválido");
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message);
  }

  try {
    const project = await projectsService.createProject(userId, parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("[projects:create]", err);
    return serverError();
  }
}
