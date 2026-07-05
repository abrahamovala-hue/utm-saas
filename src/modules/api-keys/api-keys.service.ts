import { generateApiKey } from "@/lib/crypto";
import { apiKeysRepository } from "./api-keys.repository";
import { projectsService } from "@/modules/projects/projects.service";

export class ApiKeyNotFoundError extends Error {
  constructor() {
    super("Chave de API não encontrada");
    this.name = "ApiKeyNotFoundError";
  }
}

export const apiKeysService = {
  async listKeys(userId: string, projectId: string) {
    await projectsService.getProject(userId, projectId); // valida propriedade
    return apiKeysRepository.listByProject(projectId);
  },

  /**
   * Cria uma chave e retorna o texto puro UMA ÚNICA VEZ.
   * Depois deste retorno, a chave é irrecuperável — só o hash existe.
   */
  async createKey(userId: string, projectId: string, name: string) {
    await projectsService.getProject(userId, projectId);

    const { key, keyHash, keyPrefix } = generateApiKey();
    const record = await apiKeysRepository.create(projectId, {
      name,
      keyHash,
      keyPrefix,
    });

    return { ...record, plainTextKey: key };
  },

  async revokeKey(userId: string, projectId: string, keyId: string) {
    await projectsService.getProject(userId, projectId);

    const existing = await apiKeysRepository.findByIdAndProject(keyId, projectId);
    if (!existing) throw new ApiKeyNotFoundError();

    return apiKeysRepository.revoke(keyId);
  },
};
