// Saturation
export {
  saturate,
  isSaturated,
  saturateWithInfo,
  type SaturationResult,
} from './saturate.js';

// Interaction resolution
export {
  resolveInteractions,
  getModifiedTraitPairs,
} from './interactions.js';

// Composer
export {
  Composer,
  compose,
  composeWithTrace,
  type CompositionStep,
  type CompositionTrace,
} from './composer.js';
