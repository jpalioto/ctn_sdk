# CLAUDE.md

## Security Rules
- NEVER write API keys, secrets, or credentials to any file
- NEVER create .env files or dotenv configurations
- NEVER hardcode credentials in code or tests
- API keys are available via process.env at runtime only
- Tests must skip gracefully if required env vars are missing

## Testing
- Integration tests check for env vars and skip if missing
- Use: `describe('Integration', { skip: !process.env.ANTHROPIC_API_KEY }, () => { ... })`
- Unit tests should never require real API keys

## Pre-commit Hooks
- All tests must pass before commit
- Staged files are scanned for API key patterns
- Commits are blocked if secrets are detected

## Detected Patterns
The following patterns trigger commit rejection:
- `sk-ant-` (Anthropic API keys)
- `sk-proj-` (OpenAI project keys)
- `AIzaSy` (Google API keys)
- `ANTHROPIC_API_KEY=` (hardcoded env assignments)
- `OPENAI_API_KEY=` (hardcoded env assignments)
- `GEMINI_API_KEY=` (hardcoded env assignments)
- `GOOGLE_API_KEY=` (hardcoded env assignments)
- `secret` followed by `=` and quoted strings

## Build & Test Commands
```bash
pnpm install          # Install dependencies
pnpm -r build         # Build all packages
pnpm -r test          # Run all tests
```

## Package Structure
```
packages/
  language/    # @ctn/language - Constraint schemas, parser, composer
  core/        # @ctn/core - Projection, provider base, config loading
  anthropic/   # @ctn/anthropic - Anthropic Claude provider
```
