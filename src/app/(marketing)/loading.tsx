import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-6" role="status" aria-label="Memuat halaman">
      <Skeleton className="h-12 w-full" />
      <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2">
        <div className="flex flex-col justify-center gap-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="aspect-square rounded-2xl" />
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-3">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <Skeleton className="aspect-[4/5] rounded-2xl" />
      </div>
    </div>
  );
}
