# CTN SDK Development Plan

**Status:** v0.2.0 (Milestone 1) — Vertical slice complete  
**Next:** v1.0.0-rc1 — Community feedback release

---

## Current State

✅ **Complete:**
- @ctn/language: Composer, parser, Zod schemas, OperationalStrategy
- @ctn/core: Projection, provider interface, kernel renderers
- @ctn/anthropic: Claude provider with YAML model configs
- @ctn/cli: Cross-platform command-line tool
- 251 tests (property-based algebraic proofs, invariant validation)
- README, CONTRIBUTING, CLAUDE.md

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
| @ctn/openai | OpenAI provider with Markdown kernel | 4h | ☐ |
| @ctn/google | Google provider with plain text kernel | 3h | ☐ |
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
- Complete Anthropic provider
- CLI tool
- Documentation (README, CONTRIBUTING, SECURITY)
- 251+ tests

**Not included:**
- OpenAI/Google providers (P1)
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
| Unit tests | 251 | 300+ |
| Property-based | 20+ | 50+ |
| Integration | 4 | 12 (4 per provider) |
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
