export type {
  Message,
  StrategySupport,
  ModelConfig,
  ProjectedConfig,
  SendOptions,
  ProviderResponse,
  CapturedRequest,
  StreamChunk,
  FeatureClampEvent,
  OverrideCollision,
  TokenBudget,
  CTNProvider,
  RequestSnapshot,
} from './types.js';

export { BaseCTNProvider } from './base.js';
export { DryRunProvider } from './dry-run-provider.js';

export {
  ProviderError,
  UnsupportedStrategyError,
  StrategyVersionMismatchError,
  InvalidProjectionMatrixError,
  ContextWindowOverflowError,
  ProviderConnectionError,
  ProviderRateLimitError,
  ProviderModelError,
  ProviderResponseError,
} from './errors.js';

export {
  resolveContextPolicy,
  applyContextPolicy,
  estimateTokens,
  calculateTokenBudget,
} from './context.js';

// Zod Schemas for type-safe validation
export {
  ApiParamValueSchema,
  ApiParamsSchema,
  MessageSchema,
  MessagesSchema,
  ProviderModelConfigSchema,
  TraitContributionSchema,
  ProjectionDetailSchema,
  ProjectedConfigSchema,
  UsageSchema,
  FinishReasonSchema,
  ProviderResponseSchema,
  TokenBudgetSchema,
  RequestSnapshotSchema,
  ResponseSnapshotSchema,
  AbstractConstraintDataSchema,
  type ApiParamValue,
  type ApiParams,
  type ProviderModelConfig,
  type RequestSnapshot as RequestSnapshotType,
  type ResponseSnapshot,
  parseApiParams,
  parseMessage,
  parseProviderResponse,
  parseRequestSnapshot,
  parseResponseSnapshot,
  validateAbstractConstraintData,
} from './schemas.js';
