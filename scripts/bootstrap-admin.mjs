import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !key || !email || process.argv.length !== 3) {
  console.error("Usage: node scripts/bootstrap-admin.mjs <admin-email>");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase.auth.admin.listUsers();
if (error) {
  console.error(`Failed to list users: ${error.message}`);
  process.exit(1);
}

const user = data.users.find((candidate) => candidate.email === email);
if (!user) {
  console.error(`User not found for email: ${email}`);
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, is_admin: true },
});
if (updateError) {
  console.error(`Failed to update user: ${updateError.message}`);
  process.exit(1);
}

console.log(`Admin access granted to ${email}`);
