// Re-export everything from the operational strategy
// This maintains backward compatibility for imports from '@ctn/language'
export {
  // Dimension definitions
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
  DIMENSION_INDEX_TO_ID,
  // Constraint definitions
  OPERATIONAL_CONSTRAINTS,
  buildConstraintMap,
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
