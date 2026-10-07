import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-10" role="status" aria-label="Memuat artikel">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-9/12" />
        <div className="grid gap-4 pt-4 sm:grid-cols-3">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <Skeleton className="aspect-[4/5] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
