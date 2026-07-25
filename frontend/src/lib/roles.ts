export type Role = "CUSTOMER" | "ADMIN";

export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN";
}
