import bcrypt from "bcryptjs";
import { authRepository } from "./auth.repository";
import type { RegisterInput } from "./auth.schemas";

const BCRYPT_ROUNDS = 12;

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("E-mail já cadastrado");
    this.name = "EmailAlreadyExistsError";
  }
}

export const authService = {
  /**
   * Registra um novo usuário.
   * A senha NUNCA é armazenada — apenas seu hash bcrypt.
   */
  async registerUser(input: RegisterInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw new EmailAlreadyExistsError();

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    // Auditoria — não pode derrubar o registro se falhar
    await authRepository.logActivity(user.id, "user.registered").catch(() => {});

    return user;
  },

  /**
   * Verifica credenciais no login.
   * Retorna o usuário se válidas; null caso contrário.
   * Importante: a resposta é idêntica para "e-mail não existe" e
   * "senha errada" — não vazamos qual dos dois falhou (enumeração de usuários).
   */
  async verifyCredentials(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user?.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return { id: user.id, name: user.name, email: user.email };
  },
};
