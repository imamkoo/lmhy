import { connectDB } from "@/lib/db";
import { DynamicArchetypeModel } from "@/models/DynamicArchetype";
import ArchetypesClient from "./ArchetypesClient";

export const dynamic = "force-dynamic";

export default async function AdminArchetypesPage() {
  await connectDB();
  const archetypes = await DynamicArchetypeModel.find().lean();
  
  // Transform ObjectIds to strings so they can be passed to client component
  const safeArchetypes = archetypes.map(a => ({
    ...a,
    _id: a._id.toString()
  }));

  return <ArchetypesClient initialArchetypes={safeArchetypes} />;
}
