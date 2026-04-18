import { Skeleton } from "@/components/ui/skeleton";
import { BloomCard } from "@/components/bloom-custom/BloomCard";

export default function AppLoading() {


  return (
    <div
      className="container max-w-5xl mx-auto p-5 sm:p-6 md:p-7 space-y-6"
     
     
     
    >
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <BloomCard key={i} className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </BloomCard>
        ))}
      </div>

      {/* Content skeleton */}
      <div>
        <BloomCard className="p-5 sm:p-6 md:p-7 space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </BloomCard>
      </div>
    </div>
  );
}
