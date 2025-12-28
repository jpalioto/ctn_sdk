# CTN SDK Implementation Bootstrap

## Context

You are implementing the CTN SDK from the design specification in `docs/CTN_SDK_Design_Specification_v1.1.0.md`. Read the full specification before writing any code.

This is a TypeScript monorepo implementing a constraint composition system for LLM inference.

## Project Structure

```
ctn_sdk/
├── packages/
│   ├── language/           # @ctn/language - Core constraint algebra
│   │   ├── src/
│   │   │   ├── types/      # Core type definitions
│   │   │   ├── parser/     # Constraint syntax parser
│   │   │   ├── composer/   # N-ary composition with saturation
│   │   │   ├── kernel/     # KernelIR generation
│   │   │   ├── strategy/   # TraitStrategy interface + Operational impl
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── core/               # @ctn/core - Provider abstractions
│   │   ├── src/
│   │   │   ├── provider/   # CTNProvider interface, BaseCTNProvider
│   │   │   ├── projection/ # Projection matrix, validation
│   │   │   ├── execution/  # Send pipeline, token budget
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── anthropic/          # @ctn/anthropic - Anthropic provider
│       ├── src/
│       │   ├── renderer/   # XML kernel renderer
│       │   ├── projection/ # Anthropic projection matrices
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   └── SPEC.md             # Design specification v1.1.0
├── package.json            # Workspace root
├── tsconfig.json
└── README.md
```

## Engineering Principles

### Dependency Injection

All major components accept dependencies via constructor injection. No static singletons.

```typescript
// Good
class Composer {
  constructor(private readonly strategy: TraitStrategy) {}
}

// Bad
class Composer {
  private strategy = OperationalStrategy.instance;
}
```

### Interfaces First

Define interfaces before implementations. Implementations live in separate files.

```typescript
// types/strategy.ts
interface TraitStrategy { ... }

// strategy/operational.ts
class OperationalStrategy implements TraitStrategy { ... }
```

### Pure Functions Where Possible

Composition and projection are pure functions. Side effects (API calls, logging) are isolated to the execution layer.

```typescript
// Pure - no side effects
function saturate(v: TraitVector): TraitVector

// Impure - isolated in execution layer
async function send(config: ProjectedConfig, messages: Message[]): Promise<Response>
```

### Immutability

IR structures are immutable. Use `readonly` liberally. Composition returns new vectors, never mutates.

```typescript
interface AbstractConstraint<S extends TraitStrategy> {
  readonly strategy: S;
  readonly traits: ReadonlyArray<number>;
  readonly features: Readonly<Features>;
  readonly kernelIR: Readonly<KernelIR>;
}
```

## Critical Implementation Invariants

These are non-negotiable. The red team review validated these requirements.

### 1. N-ary Composition with Single Normalization

```typescript
// CORRECT: Accumulate raw, normalize once
function compose(constraints: ResolvedConstraint[]): TraitVector {
  const rawSum = constraints.reduce(
    (acc, c) => add(acc, c.traits),  // Raw addition
    identity()
  );
  return saturate(rawSum);  // Single normalization at end
}

// WRONG: Per-step normalization breaks associativity
function compose(constraints: ResolvedConstraint[]): TraitVector {
  return constraints.reduce(
    (acc, c) => saturate(add(acc, c.traits)),  // ❌ Normalizes each step
    identity()
  );
}
```

### 2. Interaction Non-Expansive Invariant

```typescript
function resolveInteractions(traits: TraitVector, interactions: Interaction[]): TraitVector {
  const result = applyInteractions(traits, interactions);
  
  // INVARIANT: Must hold
  assert(magnitude(result) <= magnitude(traits));
  
  return result;
}
```

### 3. Feature-as-Clamps (Post-Projection)

```typescript
// CORRECT: Features clamp projection output
const projected = project(traits, matrix);
const clamped = applyFeatureClamps(projected, features);  // MIN/MAX/EXCLUSIVE
const final = applyOverrides(clamped, overrides);

// WRONG: Features as initial values that projection overrides
const initial = { ...features };
const final = { ...initial, ...projected };  // ❌ Projection wins
```

### 4. Projection Iterates Over Baseline Keys

```typescript
function project(traits: TraitVector, matrix: ProjectionMatrix): Record<string, number> {
  const result: Record<string, number> = {};
  
  // CORRECT: Iterate baseline keys, not weights
  for (const param of Object.keys(matrix.baseline)) {
    const weights = matrix.weights[param] ?? zeroRow;  // Implicit zeros
    // ... compute projection
  }
  
  return result;
}
```

### 5. KernelIR Ownership Split

```typescript
// Language layer generates content
const kernelIR = generateKernelIR(traits, strategy, appliedInteractions);

// Provider only formats
const kernelText = provider.renderKernel(kernelIR);  // XML or Markdown
```

## Testing Strategy

### Unit Tests for Algebra

```typescript
describe('Composer', () => {
  it('is associative', () => {
    const a = resolve('@creative');
    const b = resolve('@analytical');
    const c = resolve('@terse');
    
    const left = compose([compose([a, b]), c]);
    const right = compose([a, compose([b, c])]);
    
    expect(left.traits).toEqual(right.traits);
  });
  
  it('is commutative', () => {
    const ab = compose([a, b]);
    const ba = compose([b, a]);
    expect(ab.traits).toEqual(ba.traits);
  });
  
  it('enforces unit ball', () => {
    const extreme = compose([a, a, a, a, a]);  // Stack same constraint
    expect(magnitude(extreme.traits)).toBeLessThanOrEqual(1);
  });
});
```

### Property-Based Tests for Invariants

Consider using fast-check for property-based testing of:
- Composition associativity/commutativity
- Interaction non-expansiveness
- Projection baseline invariant

## Build Order

1. **@ctn/language types** - TraitVector, TraitStrategy interface, Features, KernelIR
2. **@ctn/language strategy** - OperationalStrategy implementation
3. **@ctn/language composer** - N-ary composition with saturation
4. **@ctn/language interactions** - Resolve with non-expansive guarantee
5. **@ctn/language kernel** - KernelIR generation
6. **@ctn/language parser** - Constraint syntax parsing
7. **@ctn/core types** - Provider interfaces, ProjectionMatrix
8. **@ctn/core projection** - Pure projection function, validation
9. **@ctn/core execution** - Send pipeline, token budget
10. **@ctn/anthropic** - Provider implementation with XML renderer

## Tooling

- TypeScript with strict mode
- Jest for testing
- ESLint + Prettier
- npm workspaces for monorepo

## Start

Begin with `packages/language/src/types/` defining the core type system. Then implement OperationalStrategy. Then Composer with tests proving associativity.

Reference `docs/SPEC.md` for all details. Ask clarifying questions if the spec is ambiguous.
