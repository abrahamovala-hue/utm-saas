import { NextResponse } from "next/server";
import { createLinkSchema } from "@/modules/links/links.schemas";
import { linksService } from "@/modules/links/links.service";
import { ProjectNotFoundError } from "@/modules/projects/projects.service";
import { requireUser, unauthorized, badRequest, notFound, serverError } from "@/lib/api-helpers";

type Params = { params: { projectId: string } };

/** GET /api/v1/projects/:id/links */
export async function GET(_req: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  try {
    const links = await linksService.listLinks(userId, params.projectId);
    return NextResponse.json({ links });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[links:list]", err);
    return serverError();
  }
}

/** POST /api/v1/projects/:id/links */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Corpo da requisição inválido");
  }

  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  try {
    const link = await linksService.createLink(userId, params.projectId, parsed.data);
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[links:create]", err);
    return serverError();
  }
}
