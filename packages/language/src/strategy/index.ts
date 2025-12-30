// Re-export everything from the operational strategy
// This maintains backward compatibility for imports from '@ctn/language'
export {
  // Dimension definitions
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
  DIMENSION_INDEX_TO_ID,
  // Trait mappings (internal - constraint names come from vocabulary)
  OPERATIONAL_TRAIT_MAPPINGS,
  OPERATIONAL_STATIC_FEATURES,
  OPERATIONAL_PARAMETERIZED,
  OPERATIONAL_SUPPORTED_CONSTRAINTS,
  isOperationalConstraint,
  type TraitMap,
  // Interaction definitions
  OPERATIONAL_INTERACTIONS,
  buildInteractionMap,
  // Operational strategy implementation
  OperationalStrategy,
  operationalStrategy,
  type OperationalStrategyConfig,
} from './operational/index.js';

// Re-export CTN strategy
export * from './ctn/index.js';
