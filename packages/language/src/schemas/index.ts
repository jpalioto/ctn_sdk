// ============================================================================
// Trait schemas and types
// ============================================================================
export {
  TraitVectorSchema,
  TraitPolesSchema,
  TraitDimensionSchema,
  LabeledTraitsSchema,
  UnitBallTraitVectorSchema,
  type TraitVector,
  type MutableTraitVector,
  type TraitPoles,
  type TraitDimension,
  type LabeledTraits,
  parseTraitVector,
  safeParseTraitVector,
  parseTraitDimension,
  parseUnitBallTraitVector,
  magnitude,
  zeroVector,
  isWithinUnitBall,
} from './trait.schema.js';

// ============================================================================
// Strategy schemas and types
// ============================================================================
export {
  ConstraintParamsSchema,
  StrategyMetadataSchema,
  type ConstraintParams,
  type StrategyMetadata,
  type TraitStrategy,
  getStrategyMetadata,
  parseStrategyMetadata,
} from './strategy.schema.js';

// ============================================================================
// Feature schemas and types
// ============================================================================
export {
  FeatureLatticeSchema,
  ContextPolicySchema,
  FeatureValueSchema,
  FeaturesSchema,
  FeatureDefinitionSchema,
  FeatureJoinResultSchema,
  type FeatureLattice,
  type ContextPolicy,
  type FeatureValue,
  type Features,
  type MutableFeatures,
  type FeatureDefinition,
  type FeatureJoinResult,
  FEATURE_LATTICES,
  getFeatureLattice,
  FeatureConflictError,
  joinFeatureValues,
  joinFeatures,
  parseFeatures,
  safeParseFeatures,
  parseContextPolicy,
} from './features.schema.js';

// ============================================================================
// Kernel schemas and types
// ============================================================================
export {
  ClauseIntensitySchema,
  ClausePolaritySchema,
  KernelClauseSchema,
  ModifiedClauseSchema,
  KernelIRSchema,
  type ClauseIntensity,
  type ClausePolarity,
  type KernelClause,
  type ModifiedClause,
  type KernelIR,
  KERNEL_THRESHOLD,
  getClauseIntensity,
  getClausePolarity,
  emptyKernelIR,
  parseKernelIR,
  safeParseKernelIR,
  parseKernelClause,
} from './kernel.schema.js';

// ============================================================================
// Interaction schemas and types
// ============================================================================
export {
  InteractionConditionSchema,
  InteractionResolutionSchema,
  TraitInteractionSchema,
  InteractionResultSchema,
  type InteractionCondition,
  type InteractionResolution,
  type TraitInteraction,
  type InteractionResult,
  INTERACTION_THRESHOLD,
  validateInteraction,
  parseTraitInteraction,
  safeParseTraitInteraction,
  parseInteractionResult,
} from './interaction.schema.js';

// ============================================================================
// Constraint schemas and types
// ============================================================================
export {
  ParsedConstraintSchema,
  ResolvedConstraintSchema,
  AbstractConstraintDataSchema,
  ConstraintParamDefinitionSchema,
  ConstraintDefinitionSchema,
  type ParsedConstraint,
  type ResolvedConstraint,
  type AbstractConstraintData,
  type AbstractConstraint,
  type ConstraintParamDefinition,
  type ConstraintDefinition,
  createResolvedConstraint,
  toAbstractConstraintData,
  parseParsedConstraint,
  parseResolvedConstraint,
  parseConstraintDefinition,
  parseAbstractConstraintData,
  isParsedConstraint,
  isResolvedConstraint,
} from './constraint.schema.js';

// ============================================================================
// Error types
// ============================================================================
export {
  CTNError,
  ParseError,
  UnknownConstraintError,
  InvalidConstraintParamError,
  MalformedConstraintError,
  CompositionError,
  StrategyMismatchError,
  DimensionMismatchError,
  ConfigError,
  ConfigNotFoundError,
  ConfigValidationError,
  ConfigSemanticError,
  ValidationError,
} from './errors.js';
