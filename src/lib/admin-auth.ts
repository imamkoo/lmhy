import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-auth-edge";
export { isAdminMetadata, isAdminUser } from "@/lib/admin-auth-edge";

export interface AdminIdentity {
  id: string;
  email: string | null;
}

export async function requireAdmin(): Promise<AdminIdentity | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !isAdminUser(data.user)) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
