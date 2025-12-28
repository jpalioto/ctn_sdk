// Dimension definitions
export {
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
  DIMENSION_INDEX_TO_ID,
} from './dimensions.js';

// Constraint definitions
export {
  OPERATIONAL_CONSTRAINTS,
  buildConstraintMap,
} from './constraints.js';

// Interaction definitions
export {
  OPERATIONAL_INTERACTIONS,
  buildInteractionMap,
} from './interactions.js';

// Operational strategy implementation
export {
  OperationalStrategy,
  operationalStrategy,
} from './operational.js';
