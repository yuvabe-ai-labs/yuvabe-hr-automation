import { usersRepository } from "@/repositories/users.repository";
import { hashPassword } from "@/lib/auth";
import type { User, UserRole } from "@/types/users";

export const usersService = {
  /** Verify via Supabase Auth, then return the user row (with role) from our table. */
  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const authId = await usersRepository.verifyWithSupabaseAuth(email, password);
    if (!authId) return null;
    return usersRepository.findById(authId);
  },

  async findAll(): Promise<User[]> {
    return usersRepository.findAll();
  },

  async findManagers(): Promise<User[]> {
    return usersRepository.findManagers();
  },

  async findById(id: string): Promise<User | null> {
    return usersRepository.findById(id);
  },

  async setPassword(userId: string, password: string): Promise<void> {
    const hash = await hashPassword(password);
    await usersRepository.updatePasswordHash(userId, hash);
  },

  async create(data: {
    email: string;
    name: string;
    role: UserRole;
    password: string;
  }): Promise<User> {
    const passwordHash = await hashPassword(data.password);
    return usersRepository.create({ ...data, passwordHash });
  },

  async update(
    id: string,
    data: Partial<{ name: string; role: UserRole }>
  ): Promise<User> {
    return usersRepository.update(id, data);
  },

  async deactivate(id: string): Promise<void> {
    return usersRepository.deactivate(id);
  },
};
