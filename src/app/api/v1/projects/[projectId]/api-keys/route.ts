import { NextResponse } from "next/server";
import { createApiKeySchema } from "@/modules/api-keys/api-keys.schemas";
import { apiKeysService } from "@/modules/api-keys/api-keys.service";
import { ProjectNotFoundError } from "@/modules/projects/projects.service";
import { requireUser, unauthorized, badRequest, notFound, serverError } from "@/lib/api-helpers";

type Params = { params: { projectId: string } };

/** GET /api/v1/projects/:id/api-keys */
export async function GET(_req: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  try {
    const keys = await apiKeysService.listKeys(userId, params.projectId);
    return NextResponse.json({ keys });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[api-keys:list]", err);
    return serverError();
  }
}

/** POST /api/v1/projects/:id/api-keys — a chave em texto puro só existe nesta resposta */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Corpo da requisição inválido");
  }

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  try {
    const key = await apiKeysService.createKey(userId, params.projectId, parsed.data.name);
    return NextResponse.json({ key }, { status: 201 });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) return notFound(err.message);
    console.error("[api-keys:create]", err);
    return serverError();
  }
}
