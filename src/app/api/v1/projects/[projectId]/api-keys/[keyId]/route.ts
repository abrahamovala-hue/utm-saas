import { NextResponse } from "next/server";
import { apiKeysService, ApiKeyNotFoundError } from "@/modules/api-keys/api-keys.service";
import { ProjectNotFoundError } from "@/modules/projects/projects.service";
import { requireUser, unauthorized, notFound, serverError } from "@/lib/api-helpers";

type Params = { params: { projectId: string; keyId: string } };

/** DELETE /api/v1/projects/:id/api-keys/:keyId — revogação (soft delete) */
export async function DELETE(_req: Request, { params }: Params) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  try {
    await apiKeysService.revokeKey(userId, params.projectId, params.keyId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProjectNotFoundError || err instanceof ApiKeyNotFoundError) {
      return notFound(err.message);
    }
    console.error("[api-keys:revoke]", err);
    return serverError();
  }
}
