export type {
  ProjectionMatrix,
  ProjectionDetail,
  ProjectionResult,
  TraitContribution,
  ProjectionValidationError,
  LossyProjectionWarning,
} from './types.js';

export { projectTraits } from './project.js';
export { validateProjectionMatrix, validateProjectionCoverage } from './validate.js';
export { computeProjectionHash } from './hash.js';
