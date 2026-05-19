import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { User, UserRole } from "@/types/users";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  created_at: string;
};

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    createdAt: row.created_at,
  };
}

export const usersRepository = {
  /** Verify credentials via Supabase Auth. Returns the auth user ID on success, null on failure. */
  async verifyWithSupabaseAuth(
    email: string,
    password: string
  ): Promise<string | null> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) return null;
    return data.user.id;
  },

  async findAll(): Promise<User[]> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data ?? []).map((r) => rowToUser(r as UserRow));
  },

  async findByEmail(
    email: string
  ): Promise<(User & { passwordHash: string }) | null> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return { ...rowToUser(data as UserRow), passwordHash: data.password_hash };
  },

  async findById(id: string): Promise<User | null> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, created_at")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return rowToUser(data as UserRow);
  },

  async findManagers(): Promise<User[]> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, created_at")
      .eq("role", "manager")
      .order("name", { ascending: true });
    if (error) throw new Error(`Failed to fetch managers: ${error.message}`);
    return (data ?? []).map((r) => rowToUser(r as UserRow));
  },

  async create(user: {
    email: string;
    name: string;
    role: UserRole;
    passwordHash: string;
  }): Promise<User> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        email: user.email,
        name: user.name,
        role: user.role,
        password_hash: user.passwordHash,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return rowToUser(data as UserRow);
  },

  async update(
    id: string,
    updates: Partial<{ name: string; role: UserRole }>
  ): Promise<User> {
    const supabase = getSupabasePeopleClient();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return rowToUser(data as UserRow);
  },

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const supabase = getSupabasePeopleClient();
    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", id);
    if (error) throw new Error(`Failed to update password: ${error.message}`);
  },

  async deactivate(id: string): Promise<void> {
    const supabase = getSupabasePeopleClient();
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw new Error(`Failed to deactivate user: ${error.message}`);
  },
};
