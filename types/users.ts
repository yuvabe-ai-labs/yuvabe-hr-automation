export type UserRole = "admin" | "manager" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};
