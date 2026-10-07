import { Skeleton } from "@/components/ui/skeleton";

export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-background p-4" role="status" aria-label="Memuat studio">
      <Skeleton className="h-14 w-full" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-[60vh] rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}
