import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  
  const result = await db.collection("mentalbatteryinstruments").updateMany(
    {},
    { 
      $set: { version: 1 },
      $unset: { status: "" }
    }
  );
  
  console.log(`Updated ${result.modifiedCount} instruments.`);
  process.exit(0);
}

run().catch(console.error);
