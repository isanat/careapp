import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { BloomCard } from "@/components/bloom-custom/BloomCard";

export default function AppLoading() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="container max-w-5xl mx-auto p-5 sm:p-6 md:p-7 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header skeleton */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </motion.div>

      {/* Stats grid skeleton */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={itemVariants}>
        {[...Array(4)].map((_, i) => (
          <BloomCard key={i} className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </BloomCard>
        ))}
      </motion.div>

      {/* Content skeleton */}
      <motion.div variants={itemVariants}>
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
      </motion.div>
    </motion.div>
  );
}
