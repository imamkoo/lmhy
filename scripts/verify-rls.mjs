const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (major < 22) {
  console.error(
    `Node.js ${major} tidak didukung. Supabase SDK butuh Node 22+ (WebSocket native).` +
      ` Repo ini memakai Node 22 (.nvmrc). Ganti dengan: nvm use 22`,
  );
  process.exit(1);
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.log('SKIP: SUPABASE_SERVICE_ROLE_KEY belum diset');
  process.exit(0);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error('SUPABASE_URL dan anon key wajib diset');
const { createClient } = await import('@supabase/supabase-js');
const anon = createClient(url, anonKey);
const service = createClient(url, serviceKey);
const tables = ['provider_applications', 'provider_documents', 'admin_audit_log'];
for (const table of tables) {
  const { data, error } = await anon.from(table).select('*').limit(1);
  if (!error && data?.length) throw new Error(`anon dapat membaca ${table}`);
}
console.log('PASS anon ditolak pada 3 tabel');
const { error: serviceError } = await service.from('provider_applications').select('*').limit(1);
if (serviceError) throw serviceError;
console.log('PASS service role dapat membaca');
const { data: files, error: storageError } = await anon.storage.from('provider-credentials').list('applications');
if (!storageError && files?.length) throw new Error('anon dapat membaca bucket');
console.log('PASS anon ditolak pada bucket');
