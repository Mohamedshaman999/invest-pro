import type { User } from "../contexts/AuthContext";

/** Même règle que `deriveRole` dans AuthContext (e-mail admin). */
export function defaultHomePathFromEmail(email: string): "/admin/dashboard" | "/dashboard" {
  const normalizedEmail = email.trim().toLowerCase();
  const isAdmin =
    normalizedEmail.startsWith("admin@") ||
    normalizedEmail.endsWith("@admin.com") ||
    normalizedEmail.includes("+admin@");
  return isAdmin ? "/admin/dashboard" : "/dashboard";
}

/** Destination après connexion ou inscription selon le rôle. */
export function defaultHomePathForUser(user: Pick<User, "role"> | null): "/admin/dashboard" | "/dashboard" {
  if (user?.role === "admin") return "/admin/dashboard";
  return "/dashboard";
}
