import { usersRepository } from "@/repositories/users.repository";
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
