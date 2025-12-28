# CTN SDK

Structured constraint composition for LLM inference.

## The Problem

LLM APIs expose low-level parameters (temperature, top_k, max_tokens) that:
- Require trial-and-error tuning
- Don't compose predictably
- Vary across providers

## The Solution

CTN provides declarative behavioral constraints that compose algebraically:

```bash
# Baseline
ctn send "Explain recursion"

# Terse + Precise (compose naturally)
ctn send "@precise @terse Explain recursion"
```

## Quick Start

```bash
pnpm add @ctn/cli
export ANTHROPIC_API_KEY=sk-ant-...
ctn send "@precise @terse Explain the stock market"
```

## Example: Constraint Composition

![Trace example showing @precise vs @precise @terse](docs/assets/trace-example-terse-1.jpg)

The same prompt with different constraints:
- `@precise` → 355 tokens, detailed explanation
- `@precise @terse` → 256 tokens (clamped), dense summary

The `--trace` flag reveals the machinery:
- **Trait vector**: `v1:-0.5, v2:+0.5, v5:+0.5`
- **Feature clamp**: `max_tokens: 256`
- **Kernel**: behavioral constraints sent to the model

## Constraints

| Constraint | Effect | Traits | Features |
|------------|--------|--------|----------|
| `@precise` | Deterministic, grounded | v1:-0.5, v5:+0.5 | |
| `@creative` | Exploratory, varied | v1:+0.5 | |
| `@terse` | Brief, dense | v2:+0.5 | max_tokens:256 |
| `@verbose` | Detailed, thorough | v2:-0.5 | |
| `@analytical` | Step-by-step reasoning | v5:+0.8 | |
| `@formal` | Professional tone | v4:+0.5 | |
| `@casual` | Conversational tone | v4:-0.5 | |
| `@strict` | Literal adherence | v6:+0.5 | |

## How It Works

1. **Parse** — Extract `@constraints` from prompt
2. **Resolve** — Map constraint names to trait vectors
3. **Compose** — N-ary vector addition (associative, commutative)
4. **Normalize** — Saturating normalization to unit ball (‖τ‖ ≤ 1)
5. **Project** — Map traits to provider-specific API parameters
6. **Generate Kernel** — Create behavioral instruction clauses
7. **Send** — Execute API call with projected config

## CLI Usage

```bash
# Basic
ctn send "Hello world"

# With constraints
ctn send "@precise @terse Explain recursion"

# Streaming
ctn send "@creative Tell me a story" --stream

# Show trace (composition + projection)
ctn send "@analytical Solve 2x + 5 = 13" --trace

# Dry run (show config without API call)
ctn send "@precise @terse Hello" --dry-run

# Model selection
ctn send "Hello" -m opus
ctn send "Hello" -m haiku
```

## Packages

| Package | Description |
|---------|-------------|
| `@ctn/language` | Constraint parsing, composition algebra, Zod schemas |
| `@ctn/core` | Projection matrices, provider interface, kernel renderers |
| `@ctn/anthropic` | Claude provider with model configs |
| `@ctn/cli` | Cross-platform command-line tool |

## Design Principles

- **Constraints, not commands** — Declarative intent, not imperative parameters
- **Composition over configuration** — Constraints combine algebraically
- **Observable by default** — Every transformation is traceable
- **Provider-agnostic semantics** — Same constraints, different backends

## Architecture

```
@ctn/language (stable)
Parse → Compose → Normalize → KernelIR
                    ↓
@ctn/core (stable)
Project → Render → Validate
                    ↓
@ctn/anthropic (provider-specific)
Send → Stream → Response
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Link CLI for local development
cd packages/cli && pnpm link --global
```

## License

MIT
