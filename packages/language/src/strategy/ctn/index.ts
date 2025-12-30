export { CTNStrategy } from './strategy.js';
export type { CTNStrategyConfig } from './strategy.js';
export { CTN_DIMENSIONS, CTN_DIMENSION_COUNT, CTN_DIMENSION_ID_TO_INDEX } from './dimensions.js';
export { CTN_INTERACTIONS } from './interactions.js';

// Internal trait mappings (strategy implementation detail)
export {
  CTN_TRAIT_MAPPINGS,
  CTN_STATIC_FEATURES,
  CTN_PARAMETERIZED,
  CTN_SUPPORTED_CONSTRAINTS,
  isCtnConstraint,
  type TraitMap,
} from './traits.js';