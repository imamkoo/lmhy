import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status" aria-label="Memuat">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
