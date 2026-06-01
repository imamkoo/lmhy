import { connectDB } from "@/lib/db";
import { MentalBatteryConfigModel } from "@/models/MentalBatteryConfig";
import ConfigClient from "./ConfigClient";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  await connectDB();
  const config = await MentalBatteryConfigModel.findOne().lean();
  
  const safeConfig = config ? {
    ...config,
    _id: config._id.toString()
  } : null;

  return <ConfigClient initialConfig={safeConfig} />;
}
