# CTN SDK Design Specification

**Version 1.1.0 — Final Draft**

Cognitive Tensor Networks: Structured Constraint Composition for LLM Inference

---

## Table of Contents

1. [Overview](#1-overview)
2. [Constraint Language](#2-constraint-language)
3. [Abstract Representation](#3-abstract-representation)
4. [Composition](#4-composition)
5. [Provider Interface](#5-provider-interface)
6. [Projection](#6-projection)
7. [Overrides](#7-overrides)
8. [Observability](#8-observability)
9. [Reference Providers](#9-reference-providers)
10. [Configuration](#10-configuration)

**Appendices:**
- [A: Reference Strategy — Operational](#appendix-a-reference-strategy--operational)
- [B: Reference Strategy — CTN](#appendix-b-reference-strategy--ctn)
- [C: Custom Strategy Guide](#appendix-c-custom-strategy-guide)
- [D: Error Types](#appendix-d-error-types)
- [E: Quick Reference](#appendix-e-quick-reference)

---

## 1. Overview

### 1.1 Purpose

The CTN SDK provides structured constraint composition for LLM inference. It transforms declarative behavioral constraints into optimized API configurations across multiple providers.

**Core thesis:** Well-defined inputs → explicit trait composition → deterministic projection → reduced variance in inference geometry → more predictable outputs.

**What the SDK is:** Infrastructure for constraint experimentation. A configuration calculus that makes behavioral control explicit and observable.

**What the SDK is not:** A claim about bypassing inference or providing novel model capabilities. The SDK makes existing control surfaces composable; it does not create new ones.

### 1.2 Architecture

The SDK separates concerns into three layers:

**@ctn/language:** Constraint syntax, parser, abstract representation, composition algebra, kernel IR generation. This layer is stable and provider-agnostic.

**@ctn/kernel:** Kernel clause generation from trait vectors. Produces a provider-agnostic intermediate representation that providers format.

**Provider implementations:** Projection matrices, kernel formatting, API calls. This layer is volatile and maintained best-effort as provider APIs evolve.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              @ctn/language                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │  Parser  │ →  │ Composer │ →  │ Kernel   │ →  │    IR    │         │
│  │          │    │          │    │ Generator│    │          │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Provider Implementation                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │Projection│ →  │  Kernel  │ →  │ Feature  │ →  │   API    │         │
│  │  Matrix  │    │ Renderer │    │  Clamps  │    │   Call   │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

Between these layers sits the Strategy interface, which defines how traits are interpreted. This enables A/B testing of different behavioral theories without breaking user code.

### 1.3 Design Principles

#### 1.3.1 Constraints, Not Commands

Constraints are declarative specifications of desired behavior. They compose algebraically. They do not prescribe implementation.

#### 1.3.2 Unit-Ball Trait Space

The trait space is bounded by ‖τ‖ ≤ 1 (unit ball), not componentwise [-1, +1] (hypercube). This introduces intentional coupling: strong intent on one axis reduces headroom on others.

This models a **constraint budget**—you cannot demand maximum creativity AND maximum analytical rigor simultaneously. Users who need independent per-axis control should use Features, not Traits.

#### 1.3.3 Separation of Trait and Feature Spaces

Traits are continuous behavioral axes (temperature-like). Features are discrete API settings (max_tokens, stop_sequences). They compose by different algebras:
- Traits: vector addition with saturating normalization (n-ary, single normalization)
- Features: lattice join with type-specific merge rules, applied as post-projection clamps

#### 1.3.4 Provider as Projection + Formatter

The provider owns:
- The projection matrix mapping trait vectors to API parameters
- The kernel renderer formatting kernel clauses for the target model

The provider does NOT own kernel content—that comes from the language layer.

#### 1.3.5 Observability by Default

Every transformation is traceable. Composition traces show how constraints combine. Projection traces show how traits become parameters. Request snapshots show the final state including feature clamp events.

#### 1.3.6 Escape Hatch

When the abstraction fails, users can override any parameter directly. Overrides are visible in traces for debugging.

#### 1.3.7 No Safety Guarantees

The SDK makes configuration explicit. It does not validate that configurations produce safe, correct, or aligned outputs. That responsibility remains with the user.

### 1.4 Formal vs Empirical Claims

The SDK separates:

**Provable (compiler semantics):** Parsing → IR → composition → projection → final request. These transformations are deterministic and testable.

**Empirical (steering semantics):** Whether these transformations reduce variance, improve controllability, or increase parity across providers. These are hypotheses to be validated experimentally.

The specification does not claim traits are orthogonal in the model, only that they are orthogonal in the user intent representation.

---

## 2. Constraint Language

### 2.1 Syntax

Constraints are specified inline with prompts using @ notation:

```
@name                    Simple constraint
@name[param=value]       With parameter
@name[a=1,b=2]           Multiple parameters
@a @b @c Text            Multiple constraints + prompt
```

The parser extracts constraints from the input, resolves them to trait vectors, and returns the remaining text as the prompt.

### 2.2 Security Note

Constraint syntax is parsed from input text. For applications where input includes untrusted user content (chat interfaces, RAG pipelines, user-generated documents), constraints should be extracted from a separate trusted channel rather than inline parsing.

#### 2.2.1 Trust Modes

**Metadata-only mode (recommended for untrusted input):**

```typescript
// Constraints from trusted source, prompt from untrusted source
const response = await ctn.send(userMessage, {
  provider,
  model,
  constraints: ['@precise', '@terse'],  // From developer config
  parseConstraints: false,               // Disable inline parsing
});
```

**Boundary-delimited parsing (template convenience, NOT a security boundary):**

```typescript
const ctn = new CTN({
  constraintBoundary: ['[[CTN:', ']]'],
});

// Parses constraints only within boundary:
// "[[CTN: @precise @terse]] What is the capital of France?"
```

**Warning:** Boundary parsing is a convenience for template construction, not a security mechanism. If attackers can include the boundary tokens in their input, they can inject constraints. For untrusted input, use metadata-only mode.

**Allowlist mode:**

```typescript
const ctn = new CTN({
  allowedConstraints: ['@precise', '@terse', '@analytical'],
});
```

#### 2.2.2 Default Behavior

| Context | Default |
|---------|---------|
| Direct API call | `parseConstraints: true` |
| Chat interface | `parseConstraints: false` (must opt-in) |
| Batch processing | `parseConstraints: false` |

### 2.3 Built-in Constraints

| Constraint | Aliases | Effect |
|------------|---------|--------|
| `@precise` | deterministic, grounded | v1:-0.5, v5:+0.5 |
| `@creative` | exploratory | v1:+0.5 |
| `@terse` | brief, concise | v2:+0.5, max_tokens:256 |
| `@verbose` | detailed, thorough | v2:-0.5 |
| `@formal` | — | v4:+0.5 |
| `@casual` | — | v4:-0.5 |
| `@analytical` | step-by-step, reasoning | v5:+0.8 |
| `@strict` | compliant | v6:+0.5 |
| `@flexible` | — | v6:-0.5 |
| `@nomemory` | isolated | context: none |
| `@lastN[n=N]` | — | context.last: N |

### 2.4 Parser

The parser is a facade over the programmatic API:

```typescript
const { constraints, prompt } = parse('@precise @terse Explain X');
```

Parsing is deterministic: the same input always produces the same constraints.

### 2.5 Custom Constraints

Custom constraints are defined in YAML configuration:

```yaml
constraints:
  - name: codeReview
    traits: { v1: -0.3, v5: 0.7, v6: 0.5 }
    features: { max_tokens: 2048 }
```

---

## 3. Abstract Representation

### 3.1 Strategy Interface

The Strategy defines the semantic meaning of the trait space:

```typescript
interface TraitStrategy {
  readonly name: string;
  readonly version: string;
  readonly dimensions: readonly TraitDimension[];
  
  identity(): TraitVector;
  add(a: TraitVector, b: TraitVector): TraitVector;  // Raw addition, no normalization
  resolve(name: string, params: Record<string, unknown>): TraitVector;
  
  formatVector(traits: TraitVector): Record<string, number>;
  formatVectorCompact(traits: TraitVector): string;
}
```

The strategy owns semantic definition. It does NOT own kernel generation, projection, or API parameter mapping.

**Critical:** The `add(a, b)` method performs raw vector addition WITHOUT normalization. Normalization is applied once by the Composer after all additions.

### 3.2 Trait Space

The trait space is a bounded vector space:

**Domain:** τ ∈ ℝⁿ with ‖τ‖ ≤ 1 (unit ball, L2 norm)

**Coordinate interpretation:**
- **-1** = Maximum inverse intent (suppress behavior)
- **0** = No preference (baseline)
- **+1** = Maximum positive intent (enhance behavior)

**Geometry:** The unit-ball constraint introduces intentional coupling: strong intent on one axis reduces headroom on others. This models a constraint budget.

**The zero vector** (τ = 0) represents "no behavioral modification"—use provider baseline for all parameters. Note that baseline should approximate but is not guaranteed to equal the provider's native model defaults.

**Norm:** All magnitude calculations use L2 (Euclidean) norm: ‖τ‖ = √(Σ τᵢ²)

### 3.3 Feature Space

Features are discrete API settings that compose by lattice join:

| Feature Type | Lattice | Join Operation | Example |
|--------------|---------|----------------|---------|
| Restrictive numeric | MIN | min(a, b) | max_tokens |
| Expansive numeric | MAX | max(a, b) | timeout |
| Categorical | EXCLUSIVE | error if a ≠ b | response_format |
| Additive set | UNION | union(a, b) | stop_sequences |

Features are applied as **post-projection clamps** (Section 5.5), not as initial values that projection can override.

### 3.4 AbstractConstraint (IR)

The intermediate representation is a self-describing, serializable payload:

```typescript
interface AbstractConstraint<S extends TraitStrategy> {
  readonly strategy: S;
  readonly traits: TraitVector;
  readonly features: Features;
  readonly kernelIR: KernelIR;
}
```

The IR is immutable and provider-agnostic. It can be serialized, stored, and replayed.

---

## 4. Composition

### 4.1 The Composer

The Composer is stateless. It applies the strategy-defined trait algebra and the fixed lattice feature algebra.

```typescript
function compose(constraints: Constraint[], strategy: TraitStrategy): AbstractConstraint
```

### 4.2 Trait Composition

Trait composition is an **n-ary operation**, not iterative binary composition. This guarantees associativity and commutativity.

#### 4.2.1 The Composition Pipeline

**Step 1: Accumulation (Linear)**

All resolved trait vectors τ₁, ..., τₙ are summed as raw vectors in ℝⁿ:

$$V_{raw} = \sum_{i=1}^{n} \tau_i$$

No normalization occurs during accumulation. Intermediate sums may have ‖V‖ > 1.

**Step 2: Saturating Normalization (Non-Linear)**

The accumulated vector is normalized exactly once:

$$\hat{\tau} = \text{saturate}(V_{raw}) = \frac{V_{raw}}{\max(1, \|V_{raw}\|)}$$

This is the only point where the unit-ball constraint is enforced.

#### 4.2.2 Why N-ary Matters

Binary composition with per-step normalization is **not associative**:

```
1D example: saturate(x) = x / max(1, |x|)

Let a = 0.6, b = 0.6, c = -0.6

(a ⊕ b) ⊕ c = saturate(saturate(1.2) + (-0.6)) = saturate(0.4) = 0.4
a ⊕ (b ⊕ c) = saturate(0.6 + saturate(0.0)) = 0.6

Result differs based on grouping.
```

N-ary composition avoids this:

```
saturate(a + b + c) = saturate(0.6) = 0.6  // Always consistent
```

#### 4.2.3 Implementation

```typescript
class Composer {
  static compose<S extends TraitStrategy>(
    strategy: S,
    constraints: ResolvedConstraint[]
  ): AbstractConstraint<S> {
    // Step 1: Raw accumulation (no normalization)
    const rawSum = constraints.reduce(
      (acc, c) => strategy.add(acc, c.traits),
      strategy.identity()
    );

    // Step 2: Single-point saturation
    const magnitude = Math.sqrt(rawSum.reduce((sum, x) => sum + x * x, 0));
    const traits: TraitVector = magnitude <= 1
      ? rawSum
      : rawSum.map(x => x / magnitude);

    // Step 3: Lattice join for features
    const features = constraints
      .map(c => c.features)
      .reduce(Composer.joinFeatures, {});

    // Step 4: Generate kernel IR (before interactions)
    const kernelIR = generateKernelIR(traits, strategy);

    return { strategy, traits, features, kernelIR };
  }
}
```

#### 4.2.4 Properties (Guaranteed)

| Property | Guarantee |
|----------|-----------|
| Commutative | Order of constraints does not affect result |
| Associative | Grouping of constraints does not affect result |
| Bounded | ‖τ‖ ≤ 1 after composition |
| Identity | Empty constraint list → τ = 0 |

### 4.3 Feature Composition

Features compose by lattice join with type-specific rules:

```
@terse:     { max_tokens: 256 }   (MIN lattice)
@verbose:   { max_tokens: 1024 }  (MIN lattice)
Composed:   { max_tokens: 256 }   (most restrictive wins)
```

Exclusive features error on conflict:

```
@json:      { response_format: 'json' }
@markdown:  { response_format: 'markdown' }
Composed:   FeatureConflictError
```

### 4.4 Composition Examples

#### 4.4.1 Constructive Interference (Orthogonal)

```
@precise: [-0.5, 0, 0, 0, 0.5, 0, 0]
@terse:   [0, 0.5, 0, 0, 0, 0, 0]
Sum:      [-0.5, 0.5, 0, 0, 0.5, 0, 0]
‖sum‖ = 0.866 < 1, no scaling needed
```

#### 4.4.2 Destructive Interference

```
@creative: [0.5, 0, 0, 0, 0, 0, 0]
@precise:  [-0.5, 0, 0, 0, 0.5, 0, 0]
Sum:       [0, 0, 0, 0, 0.5, 0, 0]
```

The Stochasticity dimension cancels; only Reasoning remains.

### 4.5 Trait Interaction Resolution

Trait interactions handle semantic conflicts that linear algebra cannot resolve (e.g., "high creativity" + "high analytical rigor" are conceptually at odds).

#### 4.5.1 Pipeline Position

```
accumulate() → normalize() → resolveInteractions() → generateKernelIR() → project()
```

Interactions are applied **after** normalization but **before** kernel generation and projection.

#### 4.5.2 Interaction Invariant

**Critical:** Interactions MUST be non-expansive transforms:

$$\|\tau'\| \leq \|\tau\| \leq 1$$

No interaction may increase the magnitude of any trait or the overall vector norm. This preserves the unit-ball constraint established by composition.

#### 4.5.3 Interaction Semantics

**Condition thresholds:**

| Condition | Definition |
|-----------|------------|
| `both_high` | Both traits have value > 0.5 |
| `both_low` | Both traits have value < -0.5 |
| `opposing` | One trait > 0.5 and other < -0.5 |

**Resolution actions:**

| Resolution | Effect | Non-expansive? |
|------------|--------|----------------|
| `priority(vX)` | Set non-priority trait to 0 | ✓ Always reduces norm |
| `suppress_both` | Set both traits to 0 | ✓ Always reduces norm |
| `modify` | Traits unchanged; kernel clause replaced | ✓ No change to norm |

**Formal definitions:**

```typescript
const INTERACTION_THRESHOLD = 0.5;

function resolveInteractions(
  traits: TraitVector,
  interactions: TraitInteraction[]
): { traits: TraitVector; appliedInteractions: string[] } {
  const result = [...traits];
  const applied: string[] = [];
  const processedPairs = new Set<string>();
  
  for (const interaction of interactions) {
    const pairKey = `${interaction.traitIndices[0]},${interaction.traitIndices[1]}`;
    if (processedPairs.has(pairKey)) continue;
    
    if (conditionMet(result, interaction)) {
      applyResolution(result, interaction);
      applied.push(interaction.id);
      processedPairs.add(pairKey);
    }
  }
  
  return { traits: result, appliedInteractions: applied };
}

function conditionMet(traits: TraitVector, interaction: TraitInteraction): boolean {
  const [i, j] = interaction.traitIndices;
  
  switch (interaction.condition) {
    case 'both_high':
      return traits[i] > INTERACTION_THRESHOLD && traits[j] > INTERACTION_THRESHOLD;
    case 'both_low':
      return traits[i] < -INTERACTION_THRESHOLD && traits[j] < -INTERACTION_THRESHOLD;
    case 'opposing':
      return (traits[i] > INTERACTION_THRESHOLD && traits[j] < -INTERACTION_THRESHOLD) ||
             (traits[i] < -INTERACTION_THRESHOLD && traits[j] > INTERACTION_THRESHOLD);
    default:
      return false;
  }
}

function applyResolution(traits: TraitVector, interaction: TraitInteraction): void {
  const [i, j] = interaction.traitIndices;
  
  switch (interaction.resolution) {
    case 'priority':
      const nonPriority = interaction.priorityIndex === i ? j : i;
      traits[nonPriority] = 0;
      break;
    case 'suppress_both':
      traits[i] = 0;
      traits[j] = 0;
      break;
    case 'modify':
      // Traits unchanged; kernel generator handles modifiedText
      break;
  }
}
```

#### 4.5.4 Evaluation Order

Interactions are evaluated in **YAML declaration order**. First matching interaction for a trait pair wins; subsequent interactions on the same pair are skipped.

```yaml
interactions:
  - id: creative-analytical
    traits: [v1, v5]
    condition: both_high
    resolution: priority
    priorityIndex: 4  # v5 wins
    
  - id: creative-compliance
    traits: [v1, v6]
    condition: both_high
    resolution: modify
    modifiedText: "Balance creative exploration with adherence to constraints"
```

#### 4.5.5 Trace Recording

The composition trace records:
- Pre-interaction trait vector
- Post-interaction trait vector
- List of applied interaction IDs

```typescript
interface CompositionTrace {
  // ...
  interactions: {
    preTraits: TraitVector;
    postTraits: TraitVector;
    applied: string[];
  };
}
```

### 4.6 Kernel IR Generation

The language layer generates a provider-agnostic kernel intermediate representation.

#### 4.6.1 Kernel Clause Structure

```typescript
interface KernelClause {
  traitId: string;
  traitIndex: number;
  intensity: 'low' | 'medium' | 'high';
  polarity: 'positive' | 'negative';
  text: string;
}

interface KernelIR {
  strategyName: string;
  strategyVersion: string;
  clauses: KernelClause[];
  omittedTraits: string[];  // Below threshold
  modifiedClauses: ModifiedClause[];  // From interactions
}

interface ModifiedClause {
  interactionId: string;
  replacedTraits: string[];
  text: string;
}
```

#### 4.6.2 Clause Generation

```typescript
const KERNEL_THRESHOLD = 0.3;

function generateKernelIR(
  traits: TraitVector,
  strategy: TraitStrategy,
  appliedInteractions: TraitInteraction[]
): KernelIR {
  const clauses: KernelClause[] = [];
  const omittedTraits: string[] = [];
  const modifiedClauses: ModifiedClause[] = [];
  
  // Track traits handled by modify interactions
  const modifiedTraitIds = new Set<string>();
  for (const interaction of appliedInteractions) {
    if (interaction.resolution === 'modify') {
      const [i, j] = interaction.traitIndices;
      modifiedTraitIds.add(strategy.dimensions[i].id);
      modifiedTraitIds.add(strategy.dimensions[j].id);
      modifiedClauses.push({
        interactionId: interaction.id,
        replacedTraits: [strategy.dimensions[i].id, strategy.dimensions[j].id],
        text: interaction.modifiedText,
      });
    }
  }
  
  // Generate clauses for non-modified traits
  for (const dim of strategy.dimensions) {
    if (modifiedTraitIds.has(dim.id)) continue;
    
    const value = traits[dim.index];
    
    if (Math.abs(value) < KERNEL_THRESHOLD) {
      omittedTraits.push(dim.id);
      continue;
    }
    
    clauses.push({
      traitId: dim.id,
      traitIndex: dim.index,
      intensity: Math.abs(value) >= 0.7 ? 'high' : Math.abs(value) >= 0.5 ? 'medium' : 'low',
      polarity: value > 0 ? 'positive' : 'negative',
      text: value > 0 ? dim.poles.positive : dim.poles.negative,
    });
  }
  
  return {
    strategyName: strategy.name,
    strategyVersion: strategy.version,
    clauses,
    omittedTraits,
    modifiedClauses,
  };
}
```

#### 4.6.3 Ownership Clarification

| Layer | Responsibility |
|-------|----------------|
| Strategy | Defines dimension semantics, pole text |
| Language (@ctn/language) | Generates KernelIR (clauses, omissions, modifications) |
| Provider | Formats KernelIR into model-specific syntax (XML/Markdown/plain) |

The provider MUST NOT interpret strategy semantics or generate clause content. It only formats the KernelIR it receives.

---

## 5. Provider Interface

### 5.1 Responsibilities

| Concern | Owner | Rationale |
|---------|-------|-----------|
| What traits mean | Strategy | Semantic definition is model-agnostic |
| What kernel says | Language layer | Content is strategy-derived |
| How kernel is formatted | Provider | Each model has format preferences |
| How to project traits | Provider | Each model has different parameter sensitivities |
| Context policy | Provider | Provider manages message history |

### 5.2 CTNProvider Interface

```typescript
interface CTNProvider {
  readonly id: string;
  readonly name: string;
  readonly models: readonly ModelConfig[];
  readonly supportedStrategies: readonly StrategySupport[];
  
  supportsStrategy(name: string, version: string): boolean;
  project(ir: AbstractConstraint, model: string): ProjectedConfig;
  renderKernel(kernelIR: KernelIR): string;
  send(config: ProjectedConfig, messages: Message[], options?: SendOptions): Promise<Response>;
  sendStream(config: ProjectedConfig, messages: Message[], options?: SendOptions): AsyncIterableIterator<Chunk>;
}

interface StrategySupport {
  name: string;
  versionRange: string;  // SemVer range, e.g., "1.x" or "^1.0.0"
}

interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  defaultMaxTokens: number;
  supportsThinking?: boolean;
  supportsStreaming?: boolean;
}
```

### 5.3 Strategy Support

Providers declare which strategies and versions they support:

```typescript
function supportsStrategy(name: string, version: string): boolean {
  const support = this.supportedStrategies.find(s => s.name === name);
  if (!support) return false;
  return semver.satisfies(version, support.versionRange);
}
```

Attempting to use an unsupported strategy throws `UnsupportedStrategyError`. Attempting to use an incompatible version throws `StrategyVersionMismatchError`.

### 5.4 Context Policy

Context policy determines how conversation history is managed:

```typescript
type ContextPolicy = 
  | { type: 'all' }
  | { type: 'none' }
  | { type: 'last'; n: number };  // n = number of messages
```

**Critical Invariant:** The system prompt (containing the kernel) is never subject to context policy. It is always sent in full.

### 5.5 Execution Pipeline

The `send()` method executes:

**Step 1: Token Budget Preflight**

Calculate context availability (Section 10.8). Throw `ContextWindowOverflowError` if over budget.

**Step 2: Context Policy Application**

Separate current message from history. Apply context policy to history only.

**Step 3: System Prompt Construction**

Build system prompt: `systemPrefix + renderedKernel`. Never sliced.

**Step 4: Projection**

Compute projected parameters from trait vector:

$$P = \text{clip}(b + s \odot (W \cdot \tau), lo, hi)$$

**Step 5: Feature Clamps (Post-Projection)**

Apply lattice-joined features as **post-projection clamps**:

| Feature Type | Clamp Rule |
|--------------|------------|
| MIN | `final = min(projected, feature)` |
| MAX | `final = max(projected, feature)` |
| EXCLUSIVE | `final = feature` (projection value discarded) |
| UNION | `final = union(projected, feature)` |

Features constrain projection; they do not replace it. This ensures constraint semantics are honored (e.g., `@terse` sets `max_tokens: 256` as an upper bound).

**Step 6: Override Application**

Apply manual overrides. User intent always wins:

```typescript
final = { ...featureClamped, ...overrides }
```

**Step 7: Execute Hooks and API Call**

Execute `beforeRequest` hook, call provider API, execute `afterResponse` hook.

### 5.6 Feature Clamp Events

When projection attempts to exceed a feature constraint, this is logged:

```typescript
interface FeatureClampEvent {
  parameter: string;
  projected: number;
  featureValue: number;
  final: number;
  constraintSource: string;  // e.g., "@terse"
  clampType: 'MIN' | 'MAX' | 'EXCLUSIVE';
}
```

Feature clamp events appear in the RequestSnapshot alongside override collisions.

---

## 6. Projection

### 6.1 Mathematical Formalism

Projection is a function from trait space to parameter space:

$$\pi: \mathbb{R}^n \to \mathbb{R}^m$$

For a trait vector τ ∈ ℝⁿ, the projected parameters P ∈ ℝᵐ are:

$$P = \text{clip}(b + s \odot (W \cdot \tau), lo, hi)$$

Where:
- $W \in \mathbb{R}^{m \times n}$ : Weight matrix
- $b \in \mathbb{R}^m$ : Baseline vector
- $s \in \mathbb{R}^m$ : Scale vector
- $lo \in \mathbb{R}^m$ : Lower bounds
- $hi \in \mathbb{R}^m$ : Upper bounds
- $\odot$ : Element-wise (Hadamard) product

### 6.2 Expanded Form

For a single parameter $p_j$:

$$p_j = \text{clip}\left( b_j + s_j \sum_{i=1}^n W_{ji}\tau_i, \text{lo}_j, \text{hi}_j \right)$$

Where $W_{ji}$ is the weight for parameter j responding to trait i.

### 6.3 Baseline Invariant

**Critical Constraint:** For all parameters j:

$$lo_j \leq b_j \leq hi_j$$

If violated, the zero vector τ = 0 produces `clip(b_j, lo_j, hi_j) ≠ b_j` ("snap to boundary"). The SDK validates this invariant at projection matrix registration.

### 6.4 Projection Matrix Schema

#### 6.4.1 Schema Invariants

A valid `ProjectionMatrix` must satisfy:

**Key alignment:**

```
keys(baseline) ⊇ keys(weights)
keys(baseline) = keys(scale) = keys(clamps)
```

All parameters in `weights` must exist in `baseline`, `scale`, and `clamps`. Parameters may exist in `baseline` without a corresponding weight row.

**Implicit zero rows:**

If a parameter exists in `baseline` but lacks a row in `weights`, the weight row is implicitly zeros. This creates a "baseline-only parameter" unaffected by traits.

#### 6.4.2 Implementation

The projection algorithm iterates over `keys(baseline)`, not `keys(weights)`:

```typescript
function projectTraits(traits: TraitVector, matrix: ProjectionMatrix): ProjectionResult {
  const params: Record<string, number> = {};
  const details: Record<string, ProjectionDetail> = {};

  for (const param of Object.keys(matrix.baseline)) {
    const weights = matrix.weights[param] ?? new Array(traits.length).fill(0);
    const dotProduct = weights.reduce((sum, w, i) => sum + w * traits[i], 0);
    const scaled = dotProduct * matrix.scale[param];
    const unclippedDelta = scaled;
    const raw = matrix.baseline[param] + scaled;
    const [lo, hi] = matrix.clamps[param];
    const clipped = Math.max(lo, Math.min(hi, raw));
    
    params[param] = clipped;
    details[param] = {
      baseline: matrix.baseline[param],
      unclippedDelta,
      raw,
      clipped,
      wasClipped: raw !== clipped,
    };
  }

  return { params, details };
}
```

#### 6.4.3 Validation

```typescript
function validateProjectionMatrix(
  matrix: ProjectionMatrix,
  strategy: TraitStrategy
): ValidationError[] {
  const errors: ValidationError[] = [];
  const baselineKeys = new Set(Object.keys(matrix.baseline));
  const dims = strategy.dimensions.length;
  
  // Key alignment checks
  for (const param of Object.keys(matrix.weights)) {
    if (!baselineKeys.has(param)) {
      errors.push({ parameter: param, issue: 'weight_without_baseline' });
    }
    if (matrix.weights[param].length !== dims) {
      errors.push({ parameter: param, issue: 'dimension_mismatch', 
                    details: `Expected ${dims}, got ${matrix.weights[param].length}` });
    }
  }
  
  for (const param of baselineKeys) {
    if (!(param in matrix.scale)) {
      errors.push({ parameter: param, issue: 'baseline_without_scale' });
    }
    if (!(param in matrix.clamps)) {
      errors.push({ parameter: param, issue: 'baseline_without_clamp' });
    }
    
    // Baseline within clamps
    const [lo, hi] = matrix.clamps[param] ?? [0, 0];
    const b = matrix.baseline[param];
    if (b < lo || b > hi) {
      errors.push({ parameter: param, issue: 'baseline_out_of_bounds',
                    details: `Baseline ${b} outside [${lo}, ${hi}]` });
    }
  }
  
  return errors;
}
```

### 6.5 Kernel Rendering

Providers format the KernelIR into model-specific syntax:

```typescript
interface KernelRenderer {
  render(ir: KernelIR): string;
}

class AnthropicKernelRenderer implements KernelRenderer {
  render(ir: KernelIR): string {
    const lines = ['<behavioral_constraints>'];
    
    for (const clause of ir.clauses) {
      const intensity = clause.intensity === 'high' ? 'Strongly' :
                        clause.intensity === 'medium' ? 'Moderately' : 'Slightly';
      lines.push(`  <constraint id="${clause.traitId}">${intensity} favor ${clause.text}</constraint>`);
    }
    
    for (const mod of ir.modifiedClauses) {
      lines.push(`  <constraint id="${mod.interactionId}">${mod.text}</constraint>`);
    }
    
    lines.push('</behavioral_constraints>');
    return lines.join('\n');
  }
}

class OpenAIKernelRenderer implements KernelRenderer {
  render(ir: KernelIR): string {
    const lines = ['## Behavioral Constraints', ''];
    
    for (const clause of ir.clauses) {
      const intensity = clause.intensity === 'high' ? 'Strongly' :
                        clause.intensity === 'medium' ? 'Moderately' : 'Slightly';
      lines.push(`- **${clause.traitId}**: ${intensity} favor ${clause.text}`);
    }
    
    for (const mod of ir.modifiedClauses) {
      lines.push(`- **${mod.interactionId}**: ${mod.text}`);
    }
    
    return lines.join('\n');
  }
}
```

### 6.6 Projection Hash

The projection hash enables drift detection:

```typescript
function computeProjectionHash(
  matrix: ProjectionMatrix,
  strategy: TraitStrategy
): string {
  const canonical = JSON.stringify({
    strategyName: strategy.name,
    strategyVersion: strategy.version,
    dimensionIds: strategy.dimensions.map(d => d.id),
    baseline: sortKeys(matrix.baseline),
    weights: sortKeys(matrix.weights),
    scale: sortKeys(matrix.scale),
    clamps: sortKeys(matrix.clamps),
  }, null, 0);
  
  return sha256(canonical).slice(0, 32);  // 128-bit
}

function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Record<string, T>);
}
```

---

## 7. Overrides

### 7.1 Purpose

| Purpose | Example |
|---------|---------|
| Escape hatch | Force specific temperature for experimentation |
| Debugging | Isolate whether issue is in projection or model |
| Edge cases | Handle provider-specific requirements |

### 7.2 Precedence Rules

Parameters merge in strict order (later wins):

```
Projected → Feature Clamps → Overrides
```

### 7.3 Usage

```typescript
const response = await provider.send(config, messages, {
  overrides: { temperature: 0.3 }
});
```

### 7.4 Override Collision Detection

When an override replaces a feature-clamped or projected value:

```typescript
interface OverrideCollision {
  parameter: string;
  source: 'feature_clamp' | 'projected';
  originalValue: unknown;
  overrideValue: unknown;
}
```

### 7.5 Visibility

All merge stages are visible in the RequestSnapshot:

```json
{
  "projected": { "apiParams": { "temperature": 0.8, "max_tokens": 1024 } },
  "featureClamped": { "apiParams": { "temperature": 0.8, "max_tokens": 256 } },
  "featureClampEvents": [
    { "parameter": "max_tokens", "projected": 1024, "featureValue": 256, "final": 256 }
  ],
  "overrides": { "temperature": 0.3 },
  "final": { "apiParams": { "temperature": 0.3, "max_tokens": 256 } }
}
```

---

## 8. Observability

### 8.1 Design Principles

| Principle | Rationale |
|-----------|-----------|
| No hidden state | Every decision is recorded |
| Opt-in detail | Minimal overhead when not observing |
| Structured output | Machine-readable for analysis |
| Causal chain | Trace from input to output |

### 8.2 Observability Points

```
Parse → Compose → Interact → KernelGen → Project → Clamp → Execute
  ↓        ↓         ↓          ↓          ↓        ↓        ↓
Parse   Compose   Interact   KernelIR   Project  Clamp   Request/
Trace   Trace     Trace                 Trace    Events  Response
```

### 8.3 Trace Types

#### 8.3.1 CompositionTrace

```typescript
interface CompositionTrace {
  strategy: { name: string; version: string };
  steps: CompositionStep[];
  traitResult: {
    raw: TraitVector;
    rawLabeled: Record<string, number>;
    normalized: TraitVector;
    normalizedLabeled: Record<string, number>;
    wasNormalized: boolean;
    normMagnitude: number;
  };
  interactions: {
    preTraits: TraitVector;
    postTraits: TraitVector;
    applied: string[];
  };
  featureResult: Features;
  kernelIR: KernelIR;
}
```

#### 8.3.2 ProjectionTrace

```typescript
interface ProjectionTrace {
  input: { strategy: string; traits: TraitVector };
  matrix: { hash: string };
  computation: ProjectionStep[];
  output: Record<string, number>;
}

interface ProjectionStep {
  parameter: string;
  baseline: number;
  dotProduct: number;
  scaled: number;
  unclippedDelta: number;
  raw: number;
  clipped: number;
  wasClipped: boolean;
  contributions: { traitId: string; weight: number; contribution: number }[];
}
```

#### 8.3.3 RequestSnapshot

```typescript
interface RequestSnapshot {
  id: string;
  provider: string;
  model: string;
  timestamp: number;
  
  ir: {
    strategy: { name: string; version: string };
    traits: TraitVector;
    traitsLabeled: Record<string, number>;
    features: Features;
    kernelIR: KernelIR;
  };
  
  projected: {
    apiParams: Record<string, unknown>;
    projectionDetails: Record<string, ProjectionDetail>;
  };
  
  featureClamped: {
    apiParams: Record<string, unknown>;
  };
  featureClampEvents: FeatureClampEvent[];
  
  overrides: Record<string, unknown>;
  overrideCollisions: OverrideCollision[];
  
  projectionHash: string;
  tokenBudget: TokenBudget;
  
  final: {
    apiParams: Record<string, unknown>;
    system: string;
    messages: Message[];
  };
}
```

### 8.4 Hooks

```typescript
interface CTNHooks {
  onParse?: (trace: ParseTrace) => void;
  onCompose?: (trace: CompositionTrace) => void;
  onProject?: (trace: ProjectionTrace) => void;
  beforeRequest?: (snapshot: RequestSnapshot) => void;
  afterResponse?: (snapshot: ResponseSnapshot) => void;
  onError?: (error: CTNError, stage: PipelineStage) => void;
}
```

### 8.5 Hashed Traces

For secure verification without plaintext exposure:

```typescript
interface HashedTrace {
  id: string;
  timestamp: number;
  
  contentHashes: {
    kernel: string;
    system: string;
    messages: string[];
    response: string;
  };
  
  // Non-sensitive data remains readable
  ir: { strategy: { name: string; version: string }; traits: TraitVector };
  projectionHash: string;
  featureClampEvents: FeatureClampEvent[];
}
```

---

## 9. Reference Providers

### 9.1 Provider Summary

| Provider | Package | Models | Kernel Format |
|----------|---------|--------|---------------|
| Anthropic | @ctn/anthropic | claude-opus-4, claude-sonnet-4-5, claude-haiku-4 | XML |
| OpenAI | @ctn/openai | gpt-4o, gpt-4o-mini, o1, o1-mini | Markdown |
| Google | @ctn/google | gemini-2.0-flash, gemini-1.5-pro | Plain |

### 9.2 Base Provider Implementation

```typescript
abstract class BaseCTNProvider implements CTNProvider {
  protected projections: Map<string, ProjectionMatrix> = new Map();
  protected abstract readonly kernelRenderer: KernelRenderer;
  
  protected registerProjection(
    strategyName: string,
    strategyVersion: string,
    matrix: ProjectionMatrix,
    strategy: TraitStrategy
  ): void {
    const errors = validateProjectionMatrix(matrix, strategy);
    if (errors.length > 0) {
      throw new InvalidProjectionMatrixError(strategyName, errors);
    }
    this.projections.set(`${strategyName}@${strategyVersion}`, matrix);
  }
  
  supportsStrategy(name: string, version: string): boolean {
    return this.supportedStrategies.some(s => 
      s.name === name && semver.satisfies(version, s.versionRange)
    );
  }
  
  project(ir: AbstractConstraint, model: string): ProjectedConfig {
    const key = `${ir.strategy.name}@${ir.strategy.version}`;
    const matrix = this.projections.get(key);
    if (!matrix) {
      throw new UnsupportedStrategyError(this.id, ir.strategy.name, ir.strategy.version);
    }
    
    const { params, details } = projectTraits(ir.traits, matrix);
    
    return {
      model,
      apiParams: params,
      projectionDetails: details,
      kernel: this.kernelRenderer.render(ir.kernelIR),
      kernelIR: ir.kernelIR,
      contextPolicy: resolveContextPolicy(ir.features),
      features: ir.features,
    };
  }
  
  renderKernel(kernelIR: KernelIR): string {
    return this.kernelRenderer.render(kernelIR);
  }
}
```

### 9.3 Cross-Provider Behavioral Parity

The same semantic intent produces optimized, model-specific configurations:

| Intent | OpenAI Params | Anthropic Params |
|--------|---------------|------------------|
| `@precise` | Low temperature, high top_p | Low temperature, high top_k |
| `@creative` | High temperature | High temperature, low top_k |
| `@analytical` | `reasoning_effort: high` (feature) | `thinking.budget` (feature) |
| `@terse` | High frequency_penalty | Kernel clause + max_tokens clamp |

**Note:** `@analytical` effects are provider-specific features, not projected parameters. The parity is in *semantic intent*, not *mechanical equivalence*.

### 9.4 Cross-Provider Usage

```typescript
const { constraints } = parse('@precise @terse Explain X');
const ir = compose(constraints, operationalStrategy);

const anthropicConfig = anthropicProvider.project(ir, 'claude-sonnet-4-5');
const openaiConfig = openaiProvider.project(ir, 'gpt-4o');

// Same KernelIR, different rendering
console.log(anthropicConfig.kernel);  // XML format
console.log(openaiConfig.kernel);     // Markdown format
```

---

## 10. Configuration

### 10.1 Configuration Hierarchy

```
SDK Config → Strategy Config → Constraint Config → Provider Config
```

Configuration merges with later values overriding earlier:

```
Default → File → Environment → Runtime
```

### 10.2 SDK Configuration

```typescript
interface CTNConfig {
  defaultStrategy: string;
  defaultProvider?: string;
  features: {
    validateOnParse: boolean;
    validateOnCompose: boolean;
    validateOnProject: boolean;
    traceEnabled: boolean;
  };
  security: {
    parseConstraints: boolean;
    constraintBoundary?: [string, string];
    allowedConstraints?: string[];
  };
  observability: ObservabilityOptions;
  hooks?: CTNHooks;
}
```

### 10.3 Strategy Configuration

```yaml
name: operational
version: "1.0.0"
description: General-purpose behavioral control strategy

dimensions:
  - id: v1
    index: 0
    label: Stochasticity
    description: Controls randomness vs determinism
    poles:
      positive: creative, exploratory responses
      negative: deterministic, grounded responses

  # ... additional dimensions

composition:
  normalization: saturating
  norm: L2

interactions:
  - id: creative-analytical
    traits: [v1, v5]
    condition: both_high
    resolution: priority
    priorityIndex: 4
    
  - id: creative-compliance
    traits: [v1, v6]
    condition: both_high
    resolution: modify
    modifiedText: "Balance creative exploration with adherence to constraints"
```

### 10.4 Constraint Configuration

```yaml
constraints:
  - name: precise
    aliases: [deterministic, grounded]
    traits: { v1: -0.5, v5: 0.5 }
    
  - name: terse
    aliases: [brief, concise]
    traits: { v2: 0.5 }
    features:
      max_tokens: 256
      
  - name: lastN
    params:
      - name: n
        type: number
        required: true
    features:
      context: { type: 'last', n: '{{n}}' }
```

### 10.5 Provider Configuration

```yaml
id: anthropic
name: Anthropic

apiKeyEnv: ANTHROPIC_API_KEY
baseUrl: https://api.anthropic.com
timeout: 30000

models:
  - id: claude-sonnet-4-5
    name: Claude Sonnet 4.5
    contextWindow: 200000
    defaultMaxTokens: 8192
    supportsThinking: true

supportedStrategies:
  - name: operational
    versionRange: "1.x"

strategies:
  - strategy: operational
    version: "1.0.0"
    projection:
      baseline:
        temperature: 1.0
        top_k: 50
      weights:
        temperature: [0.6, 0, 0, 0, -0.4, -0.2, 0]
        top_k: [-0.5, 0, 0, 0, 0.3, 0.4, 0]
      scale:
        temperature: 0.6
        top_k: 40
      clamps:
        temperature: [0, 1]
        top_k: [1, 100]

kernelFormat: xml
```

### 10.6 Configuration Validation

All configuration is validated at load time:

- Schema validation (JSON Schema)
- Dimension indices are contiguous
- Interactions reference valid dimensions
- Interaction resolutions are non-expansive
- Projection matrix key alignment
- Baseline within clamps
- Weight row dimensions match strategy
- Strategy versions are valid SemVer

### 10.7 Implementation Utilities

#### 10.7.1 Strict Mode (Lossy Projection Detection)

```typescript
function validateProjectionCoverage(
  strategy: TraitStrategy,
  matrix: ProjectionMatrix
): LossyProjectionWarning[] {
  const warnings: LossyProjectionWarning[] = [];
  
  for (const dim of strategy.dimensions) {
    const hasWeight = Object.values(matrix.weights)
      .some(row => row[dim.index] !== 0);
    
    if (!hasWeight) {
      warnings.push({
        traitId: dim.id,
        message: `Trait '${dim.label}' has no projection weight; ` +
                 `semantic intent expressed via kernel only`,
      });
    }
  }
  
  return warnings;
}
```

#### 10.7.2 Trace Replay

```typescript
async function replayTrace(
  trace: UnifiedTrace,
  provider: CTNProvider
): Promise<ReplayResult> {
  const config: ProjectedConfig = {
    model: trace.request.model,
    apiParams: trace.request.final.apiParams,
    kernel: trace.request.final.system,
    contextPolicy: trace.request.projected.contextPolicy,
    features: trace.request.ir.features,
  };
  
  const response = await provider.send(config, trace.request.final.messages);
  
  return {
    response,
    projectionHashMatch: trace.request.projectionHash === currentProjectionHash,
  };
}
```

### 10.8 Preflight Token Budgeting

The provider must validate context availability before execution.

#### 10.8.1 Budget Calculation

```typescript
interface TokenBudget {
  modelLimit: number;
  systemTokens: number;
  historyTokens: number;
  currentMessageTokens: number;
  reservedOutput: number;
  available: number;
  overBudget: boolean;
}

function calculateTokenBudget(
  config: ProjectedConfig,
  messages: Message[],
  model: ModelConfig
): TokenBudget {
  const systemTokens = estimateTokens(config.systemPrefix + config.kernel);
  const history = applyContextPolicy(messages.slice(0, -1), config.contextPolicy);
  const historyTokens = estimateTokens(history);
  const currentMessageTokens = estimateTokens(messages[messages.length - 1]);
  const reservedOutput = config.features.max_tokens ?? model.defaultMaxTokens;
  
  const used = systemTokens + historyTokens + currentMessageTokens + reservedOutput;
  const available = model.contextWindow - used;
  
  return {
    modelLimit: model.contextWindow,
    systemTokens,
    historyTokens,
    currentMessageTokens,
    reservedOutput,
    available,
    overBudget: available < 0,
  };
}
```

#### 10.8.2 Failure Modes

| Condition | Behavior |
|-----------|----------|
| `available < 0` | Throw `ContextWindowOverflowError` |
| `available < 100` | Log warning |
| `systemTokens > modelLimit * 0.5` | Log warning |

```typescript
class ContextWindowOverflowError extends Error {
  constructor(public readonly budget: TokenBudget) {
    super(
      `Context window exceeded by ${Math.abs(budget.available)} tokens. ` +
      `System: ${budget.systemTokens}, History: ${budget.historyTokens}, ` +
      `Current: ${budget.currentMessageTokens}, Reserved: ${budget.reservedOutput}`
    );
  }
}
```

---

## Appendix A: Reference Strategy — Operational

### A.1 Dimension Definitions

| ID | Index | Label | Negative Pole | Positive Pole |
|----|-------|-------|---------------|---------------|
| v1 | 0 | Stochasticity | deterministic, grounded responses | creative, exploratory responses |
| v2 | 1 | Concision | detailed, thorough responses | brief, dense responses |
| v3 | 2 | Agency | reactive, wait for instruction | proactive, anticipate needs |
| v4 | 3 | Formality | casual, conversational tone | formal, professional tone |
| v5 | 4 | Reasoning | quick, intuitive answers | step-by-step analytical reasoning |
| v6 | 5 | Compliance | flexible interpretation | strict literal adherence |
| v7 | 6 | Context Density | minimal context reference | heavy context utilization |

### A.2 Trait Interactions

| ID | Traits | Condition | Resolution | Rationale |
|----|--------|-----------|------------|-----------|
| creative-analytical | v1, v5 | both_high (>0.5) | priority(v5) | Analytical requires determinism |
| creative-compliance | v1, v6 | both_high (>0.5) | modify | "Balance creative exploration with adherence to constraints" |
| agency-compliance | v3, v6 | both_high (>0.5) | priority(v6) | Compliance for safety |

**Evaluation order:** Top to bottom. First match for a trait pair wins.

**Non-expansive guarantee:** All defined resolutions either zero traits or leave them unchanged, preserving ‖τ'‖ ≤ ‖τ‖.

### A.3 Composition Rules

```
Normalization: saturating (n-ary, single application)
  saturate(V) = V / max(1, ‖V‖)

Norm: L2 (Euclidean)
  ‖V‖ = √(Σ vᵢ²)

Kernel threshold: 0.3
  Traits with |value| < 0.3 omitted from kernel clauses

Identity: [0, 0, 0, 0, 0, 0, 0]
```

---

## Appendix B: Reference Strategy — CTN

### B.1 Dimension Definitions

| ID | Index | Label | Negative Pole | Positive Pole |
|----|-------|-------|---------------|---------------|
| v1 | 0 | Atomic Derivation | Holistic | Atomic |
| v2 | 1 | Specification Accuracy | Approximate | Precise |
| v3 | 2 | Context Isolation | Contextual | Isolated |
| v4 | 3 | Global Invariance | Local | Global |
| v5 | 4 | Orthogonal Detachment | Attached | Detached |
| v6 | 5 | Unbound Search | Bounded | Unbound |
| v7 | 6 | Syntactic Minimalism | Verbose | Minimal |

### B.2 Mapping to Operational

| CTN Dimension | Operational Equivalent |
|---------------|------------------------|
| Atomic Derivation | Reasoning |
| Specification Accuracy | Compliance |
| Context Isolation | ~Context Density (inverted) |
| Global Invariance | (no direct equivalent) |
| Orthogonal Detachment | ~Formality |
| Unbound Search | Stochasticity |
| Syntactic Minimalism | Concision |

---

## Appendix C: Custom Strategy Guide

### C.1 When to Create a Custom Strategy

Create a custom strategy when:
- Operational dimensions don't capture your domain's behavioral axes
- You need domain-specific constraint vocabulary
- You're researching alternative behavioral models

### C.2 Design Principles

**Dimension Independence:** Dimensions should be conceptually orthogonal (in user intent space, not necessarily in model behavior).

**Bipolar Symmetry:** Each dimension should have meaningful extremes in both directions.

**Projectable Dimensions:** Dimensions should map to observable API parameters or kernel instructions.

**Non-Expansive Interactions:** All interaction resolutions must satisfy ‖τ'‖ ≤ ‖τ‖.

### C.3 Strategy Versioning

Strategies use SemVer:
- **Major:** Dimension reordering, semantic changes
- **Minor:** New interactions, new constraints
- **Patch:** Documentation, bug fixes

Providers bind to version ranges (e.g., `"1.x"`) and validate compatibility at projection time.

---

## Appendix D: Error Types

### D.1 Error Hierarchy

```
CTNError (base)
├── ParseError
│   ├── UnknownConstraintError
│   ├── InvalidConstraintParamError
│   └── MalformedConstraintError
├── CompositionError
│   ├── StrategyMismatchError
│   ├── DimensionMismatchError
│   └── FeatureConflictError
├── ProjectionError
│   ├── UnsupportedStrategyError
│   ├── StrategyVersionMismatchError
│   └── InvalidProjectionMatrixError
├── ProviderError
│   ├── ProviderConnectionError
│   ├── ProviderRateLimitError
│   ├── ProviderModelError
│   ├── ProviderResponseError
│   └── ContextWindowOverflowError
└── ConfigError
    ├── ConfigNotFoundError
    ├── ConfigValidationError
    └── ConfigSemanticError
```

### D.2 Error Handling Pattern

```typescript
try {
  const response = await ctn.send('@precise Explain X', { provider, model });
} catch (error) {
  if (error instanceof ContextWindowOverflowError) {
    // Reduce history or output reservation
    console.log('Budget:', error.budget);
  }
  if (error instanceof StrategyVersionMismatchError) {
    // Strategy version incompatible with provider
    console.log(`Need ${error.irVersion}, provider supports ${error.providerRange}`);
  }
  if (error instanceof ProviderRateLimitError) {
    await sleep(error.retryAfter ?? 60);
    return retry();
  }
  throw error;
}
```

---

## Appendix E: Quick Reference

### E.1 Constraint Syntax

```
@name                    Simple constraint
@name[param=value]       With parameter
@a @b @c Text            Multiple constraints + prompt
```

### E.2 Pipeline

```
Parse → Compose → Normalize → Interact → KernelGen → Project → Clamp → Execute
```

### E.3 Key Formulas

**Composition (n-ary):**

$$V_{raw} = \sum_i \tau_i$$
$$\hat{\tau} = \frac{V_{raw}}{\max(1, \|V_{raw}\|)}$$

**Interaction invariant:**

$$\|\tau'\| \leq \|\tau\| \leq 1$$

**Projection:**

$$P = \text{clip}(b + s \odot (W \cdot \tau), lo, hi)$$

**Feature clamps (post-projection):**

$$p_{final} = \min(p_{projected}, p_{feature})$$ (for MIN lattice)

### E.4 Layer Ownership

| Layer | Owns |
|-------|------|
| Strategy | Dimension semantics, pole text |
| Language | Composition, KernelIR generation |
| Provider | Projection matrix, kernel formatting, API call |

---

## Compatibility Notes

### From v1.0.0 to v1.1.0

**API compatible, output behavior may differ.**

**Behavioral changes:**

1. **Composition:** Now guaranteed n-ary with single normalization. Binary-per-step implementations will produce different results.

2. **Feature clamps:** Features now constrain projection output rather than being overridden by it. `@terse max_tokens:256` is now enforced.

3. **Interaction thresholds:** Explicitly defined as > 0.5.

4. **Projection iteration:** Now iterates over `baseline` keys. Baseline-only parameters now correctly project.

**Configuration changes:**

1. Provider configs require `versionRange` for strategy support.
2. Applications should set `parseConstraints: false` for untrusted input.
3. Strategy configs should specify interaction IDs.

---

## Implementation Checklist

| Item | Priority | Section |
|------|----------|---------|
| N-ary composition (accumulate then normalize once) | Critical | 4.2 |
| Unit-ball geometry with L2 norm | Critical | 3.2 |
| Interaction non-expansive invariant | Critical | 4.5 |
| Feature-as-clamps (post-projection) | Critical | 5.5 |
| KernelIR generation in language layer | Critical | 4.6 |
| Projection matrix key alignment validation | Critical | 6.4 |
| Strategy version binding | High | 5.3, 10.5 |
| Constraint scoping for untrusted input | High | 2.2 |
| Preflight token budgeting | High | 10.8 |
| `unclippedDelta` in projection details | High | 6.4 |
| Feature clamp event logging | High | 5.6 |
| Enhanced projection hash (128-bit, versioned) | Medium | 6.6 |
| Strict Mode for lossy projection detection | Medium | 10.7 |
| Trace Replay utility | Medium | 10.7 |

---

*CTN SDK Design Specification v1.1.0 — Final Draft*
