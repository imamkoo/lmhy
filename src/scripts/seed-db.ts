import mongoose from "mongoose";
import { User, UserRole } from "../models/User";
import { MentalBatteryConfigModel } from "../models/MentalBatteryConfig";
import { DynamicArchetypeModel } from "../models/DynamicArchetype";
import { MentalBatteryInstrumentModel } from "../models/MentalBatteryInstrument";
import { ARCHETYPES } from "../data/mental-battery/archetypes";
import { MENTAL_BATTERY_SECTIONS } from "../data/mental-battery/questions-id";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

export async function seed(uriOverride?: string) {
  const uriToConnect = uriOverride || MONGODB_URI;
  if (!uriToConnect) {
    console.error("MONGODB_URI is not defined.");
    return;
  }

  try {
    // If we're already connected (e.g. from connectDB), don't reconnect
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uriToConnect);
      console.log("Connected to MongoDB for seeding.");
    } else {
      console.log("Reusing existing MongoDB connection for seeding.");
    }

    // 1. Seed Admin User
    const adminEmail = "admin@lmhy.id";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const passwordHash = await hash("lmhyadmin2026", 10);
      await User.create({
        name: "Admin LMHY",
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      });
      console.log(`Admin user created: ${adminEmail} / lmhyadmin2026`);
    } else {
      // Ensure role is admin
      if (existingAdmin.role !== UserRole.ADMIN) {
        existingAdmin.role = UserRole.ADMIN;
        await existingAdmin.save();
        console.log(`Updated existing admin user role to ADMIN.`);
      } else {
        console.log(`Admin user already exists.`);
      }
    }

    // 2. Seed MentalBatteryConfig
    const configCount = await MentalBatteryConfigModel.countDocuments();
    if (configCount === 0) {
      await MentalBatteryConfigModel.create({
        weights: {
          phq9: 0.3,
          gad7: 0.25,
          dass_depression: 0.2,
          dass_anxiety: 0.15,
          dass_stress: 0.1,
        },
      });
      console.log("MentalBatteryConfig seeded.");
    } else {
      console.log("MentalBatteryConfig already exists.");
    }

    // 3. Seed DynamicArchetypes
    const archetypeValues = Object.values(ARCHETYPES);
    let archetypesAdded = 0;

    for (const arch of archetypeValues) {
      const existingArch = await DynamicArchetypeModel.findOne({ archetypeId: arch.id });
      if (!existingArch) {
        await DynamicArchetypeModel.create({
          archetypeId: arch.id,
          name: arch.name,
          emoji: arch.emoji,
          tagline: arch.tagline,
          description: arch.description,
          signals: arch.signals,
          gradient: arch.gradient,
          accentColor: arch.accentColor,
        });
        archetypesAdded++;
      }
    }

    if (archetypesAdded > 0) {
      console.log(`${archetypesAdded} DynamicArchetypes seeded.`);
    } else {
      console.log("All DynamicArchetypes already exist.");
    }

    // 4. Seed Instruments
    const instrumentCount = await MentalBatteryInstrumentModel.countDocuments();
    if (instrumentCount === 0) {
      let seededInstrumentCount = 0;
      for (const section of MENTAL_BATTERY_SECTIONS) {
        await MentalBatteryInstrumentModel.create({
          instrumentId: section.instrumentId,
          title: section.title,
          instruction: section.instruction,
          scaleLabels: section.scaleLabels,
          questions: section.questions,
          status: "DRAFT",
          editable: false,
          version: 1,
          updatedBy: "system (seed)",
        });
        seededInstrumentCount++;
      }
      console.log(`${seededInstrumentCount} Instruments seeded.`);
    }

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    // Only disconnect if we were run directly (not via connectDB)
    if (require.main === module) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  }
}

// Automatically run if this file is executed directly
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
