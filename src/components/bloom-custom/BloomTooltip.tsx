import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

/**
 * Bloom Tooltip - Re-export wrapper for hover tooltip components
 *
 * Components exported:
 * - Tooltip: Root tooltip element
 * - TooltipTrigger: Element that triggers the tooltip
 * - TooltipContent: Content displayed in the tooltip
 * - TooltipProvider: Context provider for tooltip behavior
 *
 * This is a wrapper layer that will be updated to import from @isanat/bloom-elements
 * when the package is published on npm.
 */

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
