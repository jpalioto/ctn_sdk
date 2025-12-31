export { CTNStrategy } from './strategy.js';
export type { CTNStrategyConfig } from './strategy.js';
export { CTN_DIMENSIONS, CTN_DIMENSION_COUNT, CTN_DIMENSION_ID_TO_INDEX } from './dimensions.js';
export { CTN_INTERACTIONS } from './interactions.js';

// CTN profiles (comprehensive constraint configurations)
export {
  CTN_PROFILES,
  DEFAULT_PROFILE,
  getProfile,
  hasProfile,
  traitsToArray,
  combineProfiles,
  type CTNProfile,
  type ProfileTraits,
  type SolverMode,
  type SolverConfig,
  type SyntaxConfig,
} from './profiles.js';

// Internal trait mappings (derived from profiles)
export {
  CTN_TRAIT_MAPPINGS,
  CTN_STATIC_FEATURES,
  CTN_PARAMETERIZED,
  CTN_SUPPORTED_CONSTRAINTS,
  isCtnConstraint,
  type TraitMap,
} from './traits.js';