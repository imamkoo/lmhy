import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected");
  
  const db = mongoose.connection.db;
  const archetypes = await db.collection("dynamicarchetypes").find({}).toArray();
  
  for (const arch of archetypes) {
    console.log(`${arch.archetypeId} -> imageUrl: ${JSON.stringify(arch.imageUrl)}`);
  }
  
  process.exit(0);
}

check().catch(console.error);
