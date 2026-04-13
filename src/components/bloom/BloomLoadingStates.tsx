'use client';

import { motion } from 'framer-motion';

interface BloomSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

/**
 * Bloom Spinner - Rotating loading indicator
 */
export function BloomSpinner({
  size = 'md',
  className = '',
}: BloomSpinnerProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${spinnerSizes[size]} border-2 border-primary/20 border-t-primary rounded-full ${className}`}
    />
  );
}

interface BloomDotsProps {
  className?: string;
}

/**
 * Bloom Dots - Three-dot loading animation with stagger
 */
export function BloomDots({ className = '' }: BloomDotsProps) {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          animate="animate"
          transition={{ delay: i * 0.1 }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      ))}
    </div>
  );
}

interface BloomShimmerProps {
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Bloom Shimmer - Gradient shimmer effect for loading states
 */
export function BloomShimmer({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: BloomShimmerProps) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`${width} ${height} rounded-lg bg-gradient-to-r from-secondary via-secondary/50 to-secondary bg-[length:200%_100%] ${className}`}
    />
  );
}

interface BloomSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Bloom Skeleton - Placeholder card for loading states
 */
export function BloomSkeleton({
  count = 3,
  className = '',
}: BloomSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card p-4 rounded-2xl border border-border">
          <BloomShimmer height="h-4 mb-3" />
          <BloomShimmer height="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Bloom Card Skeleton - Full-width card placeholder
 */
export function BloomCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card p-8 rounded-3xl border border-border space-y-6 ${className}`}>
      <div className="space-y-3">
        <BloomShimmer height="h-6 w-2/3" />
        <BloomShimmer height="h-4 w-full" />
        <BloomShimmer height="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        <BloomShimmer height="h-4 w-1/4" />
        <BloomShimmer height="h-4 w-full" />
        <BloomShimmer height="h-4 w-4/5" />
      </div>
    </div>
  );
}
