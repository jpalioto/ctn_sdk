# CTN SDK Development Plan

**Status:** v0.3.0 (Milestone 2) — Multi-provider support complete
**Next:** v1.0.0-rc1 — Community feedback release

---

## Current State

✅ **Complete:**
- @ctn/language: Composer, parser, Zod schemas, OperationalStrategy, CTNStrategy
- @ctn/core: Projection, provider interface, capability-based kernel renderers
- @ctn/anthropic: Claude provider (Sonnet, Opus, Haiku)
- @ctn/google: Gemini provider (2.5 Flash/Pro, 3 Preview)
- @ctn/openai: GPT-5 provider (5.2, 5.1, Mini) using Responses API
- @ctn/cli: Cross-platform command-line tool with `--provider`, `--model`, `--ground`
- 287 tests (property-based algebraic proofs, invariant validation)
- README, CONTRIBUTING, PHILOSOPHY, CLAUDE.md

---

## Roadmap

### P0 — Ship Blockers (v1.0.0-rc1)

| Item | Description | Est. | Status |
|------|-------------|------|--------|
| Trace Replay | `replayTrace(trace, provider)` for debugging regressions | 2h | ☐ |
| Unified Trace | Merge Parse + Composition + Projection traces | 1h | ☐ |
| Security Guide | `docs/SECURITY.md` — trust modes, when to use each | 1h | ☐ |

**Exit criteria:** Complete observability story, security documented.

### P1 — Cross-Provider Parity (v1.0.0)

| Item | Description | Est. | Status |
|------|-------------|------|--------|
| @ctn/openai | OpenAI provider with GPT-5 (Responses API) | 4h | ✅ |
| @ctn/google | Google provider with Gemini (@google/genai SDK) | 3h | ✅ |
| Differential Tests | Same IR → multiple providers, measure variance | 4h | ☐ |
| Parity Metrics | Define "equivalence" as tolerance bands | 2h | ☐ |

**Exit criteria:** Same constraint produces comparable behavior across 3 providers.

### P2 — Polish (v1.1.0)

| Item | Description | Est. | Status |
|------|-------------|------|--------|
| API Documentation | TypeDoc generation | 2h | ☐ |
| npm Publish Pipeline | CI/CD for releases | 3h | ☐ |
| Example Projects | Real-world usage patterns | 4h | ☐ |
| Hashed Trace Verify | Confirm secure logging works | 1h | ☐ |
| Custom Strategy Guide | Worked example beyond Operational | 2h | ☐ |

### P3 — Community Requests (Backlog)

| Item | Description | Status |
|------|-------------|--------|
| Additional Strategies | Domain-specific (coding, research, etc.) | ☐ |
| Web UI | Browser-based constraint composer | ☐ |
| VS Code Extension | Inline constraint hints | ☐ |
| Prompt Library | Curated constraint combinations | ☐ |

---

## Release Plan

### v1.0.0-rc1 — Community Feedback

**Goal:** Get the SDK into hands of early adopters for validation.

**Contents:**
- Complete Anthropic, Google, and OpenAI providers
- CLI tool with multi-provider support (`--provider`, `--model`)
- Grounding support (`--ground`)
- Documentation (README, CONTRIBUTING, PHILOSOPHY, SECURITY)
- 287+ tests

**Not included:**
- npm publish (manual install via git)

**Feedback requested:**
- Does the constraint model make sense?
- Are the built-in constraints useful?
- What constraints are missing?
- Provider priorities (OpenAI vs Google vs others)?
- Pain points in the API?

### v1.0.0 — Stable Release

**Goal:** Production-ready multi-provider SDK.

**Requirements:**
- P0 complete
- P1 complete
- Community feedback incorporated
- npm published

### v1.1.0 — Enhanced

**Goal:** Polish and ecosystem growth.

**Contents:**
- P2 items
- Community-contributed providers
- Additional strategies

---

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit tests | 287 | 350+ |
| Property-based | 25+ | 50+ |
| Integration | 12 (4 per provider) | 18 (6 per provider) |
| E2E | 0 | 6 |

---

## Open Questions

1. **Parity definition** — How do we measure "equivalent behavior" across providers with fundamentally different sampling strategies?

2. **Kernel effectiveness** — How much does the kernel contribute vs. the projected parameters? Need ablation studies.

3. **Strategy versioning** — When does a strategy change warrant a major version bump?

4. **Community governance** — How do we handle contributed providers/strategies?

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Adding providers
- Adding strategies  
- Adding constraints
- Projection matrix tuning
- Code style

---

## Changelog

### v0.3.0 (Milestone 2) — 2025-12-29
- Multi-provider support: Anthropic, Google, OpenAI
- @ctn/google: Gemini 2.5/3 with @google/genai SDK
- @ctn/openai: GPT-5 family with Responses API
- CLI: `--provider`, `--model`, `--ground` flags
- Capability-based kernel renderer negotiation
- CTNStrategy implementation
- 287 tests

### v0.2.0 (Milestone 1) — 2025-12-28
- Complete vertical slice
- Type safety hardening (no `any`)
- 251 tests
- README, CONTRIBUTING

### v0.1.0 (Milestone 0) — 2025-12-28
- Initial working SDK
- Anthropic provider
- CLI tool
- 159 tests
