// Dimension definitions
export {
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
  DIMENSION_INDEX_TO_ID,
} from './dimensions.js';

// Internal trait mappings (strategy implementation detail)
export {
  OPERATIONAL_TRAIT_MAPPINGS,
  OPERATIONAL_STATIC_FEATURES,
  OPERATIONAL_PARAMETERIZED,
  OPERATIONAL_SUPPORTED_CONSTRAINTS,
  isOperationalConstraint,
  type TraitMap,
} from './traits.js';

// Interaction definitions
export {
  OPERATIONAL_INTERACTIONS,
  buildInteractionMap,
} from './interactions.js';

// Operational strategy implementation
export {
  OperationalStrategy,
  operationalStrategy,
  type OperationalStrategyConfig,
} from './strategy.js';
