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
  SemVerSchema,
  ConstraintParamValueSchema,
  ConstraintParamsSchema,
  StrategyMetadataSchema,
  StrategyThresholdsSchema,
  StrategyConfigSchema,
  type SemVer,
  type ParsedSemVer,
  type ConstraintParamValue,
  type ConstraintParams,
  type StrategyMetadata,
  type StrategyThresholds,
  type StrategyConfig,
  type TraitStrategy,
  DEFAULT_THRESHOLDS,
  isValidSemVer,
  parseSemVer,
  getStrategyMetadata,
  parseStrategyMetadata,
  parseStrategyConfig,
  safeParseStrategyConfig,
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
  // Type guards
  isNumericFeature,
  isSetFeature,
  isContextPolicy,
  isStringFeature,
  isBooleanFeature,
  getFeatureType,
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
// Security schemas and types
// ============================================================================
export {
  TrustModeSchema,
  type TrustMode,
  type SecurityOptions,
  DEFAULT_CONSTRAINT_BOUNDARY,
  toParserOptions,
} from './security.schema.js';

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
