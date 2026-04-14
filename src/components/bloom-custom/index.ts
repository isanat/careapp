/**
 * Bloom Components - Customizações e componentes específicos do careapp
 *
 * Nota: Temporariamente usando componentes do UI local.
 * Quando @isanat/bloom-elements for publicado no NPM, substitua por:
 *
 * export { Card as BloomCard } from "@isanat/bloom-elements";
 * export { Badge as BloomBadge } from "@isanat/bloom-elements";
 * export { Separator as BloomSectionDivider } from "@isanat/bloom-elements";
 * export { SectionHeader as BloomSectionHeader } from "@isanat/bloom-elements";
 * export { StatBlock as BloomStatBlock } from "@isanat/bloom-elements";
 */

// Re-exports e wrappers locais para compatibilidade (temporário até publicação no NPM)
export { BloomCard } from "./BloomCard";
export { BloomBadge } from "./BloomBadge";
export { BloomSectionDivider } from "./BloomSectionDivider";

// Componentes customizados específicos do careapp
export { BloomEmpty } from "./BloomEmpty";
export { BloomMotionCard } from "./BloomMotionCard";
export { BloomActionButtonGroup } from "./BloomActionButtonGroup";
export { BloomAlert } from "./BloomAlert";
export { BloomToastProvider, showBloomToast, bloomToast } from "./BloomToast";
export { BloomProgress } from "./BloomProgress";
export {
  BloomSpinner,
  BloomDots,
  BloomShimmer,
  BloomSkeleton,
  BloomCardSkeleton,
} from "./BloomLoadingStates";
export { BloomInfoRow } from "./BloomInfoRow";
export { BloomStatCard } from "./BloomStatCard";
export { BloomSectionHeader } from "./BloomSectionHeader";
export { BloomStatBlock } from "./BloomStatBlock";
