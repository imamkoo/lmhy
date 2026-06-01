import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seed } from "@/scripts/seed-db"; // ensure this is accessible

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  mongod: MongoMemoryServer | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  mongod: null,
};

global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    let uriToConnect = MONGODB_URI;
    
    // For QA Automation / Local dev without real MongoDB
    if (MONGODB_URI === "memory") {
      console.log("[QA] Starting MongoDB Memory Server for local dev...");
      if (!cached.mongod) {
        cached.mongod = await MongoMemoryServer.create();
      }
      uriToConnect = cached.mongod.getUri();
    }

    cached.promise = mongoose.connect(uriToConnect, {
      bufferCommands: false,
    }).then(async (mongooseInstance) => {
      // Auto-seed if using memory DB to ensure admin user exists
      if (MONGODB_URI === "memory") {
        console.log("[QA] Seeding in-memory database...");
        try {
          await seed(uriToConnect); // Pass URI to seed
        } catch (err) {
          console.error("Seed error:", err);
        }
      }
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
