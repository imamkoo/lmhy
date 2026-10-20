import { purgeExpiredDocuments } from "../src/lib/mitra/retention.ts";

async function main() {
  console.log("Starting credential document retention purge (>90 days post-decision)...");
  const result = await purgeExpiredDocuments();
  console.log("Document purge summary:");
  console.log(`- Successfully purged: ${result.purged}`);
  console.log(`- Errors encountered: ${result.errors}`);
  if (result.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Document purge encountered unexpected error:", err);
  process.exit(1);
});
