import { projectsRepository } from "./projects.repository";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas";

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Projeto não encontrado");
    this.name = "ProjectNotFoundError";
  }
}

export const projectsService = {
  listProjects(userId: string) {
    return projectsRepository.listByUser(userId);
  },

  async getProject(userId: string, projectId: string) {
    const project = await projectsRepository.findByIdForUser(projectId, userId);
    if (!project) throw new ProjectNotFoundError();
    return project;
  },

  async createProject(userId: string, input: CreateProjectInput) {
    const project = await projectsRepository.create(userId, input);
    await projectsRepository
      .logActivity(userId, project.id, "project.created")
      .catch(() => {});
    return project;
  },

  async updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
    await this.getProject(userId, projectId); // valida propriedade
    const project = await projectsRepository.update(projectId, input);
    await projectsRepository
      .logActivity(userId, projectId, "project.updated")
      .catch(() => {});
    return project;
  },
};
