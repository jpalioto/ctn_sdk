export type {
  ProjectionMatrix,
  ProjectionDetail,
  ProjectionResult,
  TraitContribution,
  ProjectionValidationError,
  LossyProjectionWarning,
  ClampBounds,
} from './types.js';

export {
  ClampBoundsSchema,
  ProjectionMatrixSchema,
  createProjectionMatrixSchemaForStrategy,
  parseProjectionMatrix,
  parseProjectionMatrixForStrategy,
} from './types.js';

export { projectTraits } from './project.js';
export { validateProjectionMatrix, validateProjectionCoverage } from './validate.js';
export { computeProjectionHash } from './hash.js';
