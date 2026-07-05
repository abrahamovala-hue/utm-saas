import { NextResponse } from "next/server";
import { updateProjectSchema } from "@/modules/projects/projects.schemas";
import { projectsService, ProjectNotFoundError } from "@/modules/projects/projects.service";
import { requireUser, unauthorized, badRequest, notFound, serverError } from "@/lib/api-helpers";

type Params = { params: { projectId: string } };

/** GET /api/v1/projects/:id */
export async function GET(_req: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  try {
    const project = await projectsService.getProject(userId, params.projectId);
    return NextResponse.json({ project });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[projects:get]", err);
    return serverError();
  }
}

/** PATCH /api/v1/projects/:id */
export async function PATCH(request: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Corpo da requisição inválido");
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  try {
    const project = await projectsService.updateProject(userId, params.projectId, parsed.data);
    return NextResponse.json({ project });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[projects:update]", err);
    return serverError();
  }
}
