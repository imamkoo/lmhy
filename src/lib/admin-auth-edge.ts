export function isAdminMetadata(meta: unknown): boolean {
  return typeof meta === "object" && meta !== null && (meta as { is_admin?: unknown }).is_admin === true;
}

export function isAdminUser(
  user: { app_metadata?: Record<string, unknown> | null } | null | undefined
): boolean {
  return !!user && isAdminMetadata(user.app_metadata);
}
