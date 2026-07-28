import { Skeleton } from "@/components/ui/skeleton";

export default function SearchIntelligenceLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[28rem] rounded-xl" />
        <Skeleton className="h-[28rem] rounded-xl" />
      </div>
    </div>
  );
}

