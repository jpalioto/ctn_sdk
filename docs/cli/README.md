# CTN CLI Reference

## Command Format

```
ctn send "<prompt>" [options]
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--provider <name>` | `-p` | Provider: anthropic, google, openai |
| `--model <name>` | `-m` | Model name or alias |
| `--strategy <name>` | `-S` | Strategy: operational (default), ctn |
| `--ground <url>` | `-g` | Fetch URL content as context |
| `--stream` | `-s` | Stream response tokens |
| `--trace` | | Show composition and projection details |
| `--dry-run` | | Show config without sending request |

## Providers

| Provider | Aliases | Default Model | API Key Variable |
|----------|---------|---------------|------------------|
| anthropic | claude | sonnet | `ANTHROPIC_API_KEY` |
| google | gemini | gemini-2.5-flash | `GEMINI_API_KEY` |
| openai | gpt | gpt-5-mini | `OPENAI_API_KEY` |

## Models

### Anthropic
| Model | Aliases |
|-------|---------|
| claude-sonnet-4-5-20250929 | sonnet |
| claude-opus-4-5-20251101 | opus |
| claude-haiku-4-5-20251001 | haiku |

### Google
| Model | Aliases |
|-------|---------|
| gemini-2.5-flash | flash |
| gemini-2.5-pro | pro |
| gemini-3-pro-preview | |
| gemini-3-flash-preview | |

### OpenAI
| Model | Aliases |
|-------|---------|
| gpt-5-mini | gpt-mini |
| gpt-5.2 | gpt |
| gpt-5.2-pro | |
| gpt-5.1 | |
| gpt-5.1-codex | codex |

## Constraints

### Behavioral

| Constraint | Effect |
|------------|--------|
| `@precise` | Deterministic, grounded responses |
| `@creative` | Exploratory, varied responses |
| `@terse` | Brief, dense output |
| `@verbose` | Detailed, thorough output |
| `@formal` | Professional tone |
| `@casual` | Conversational tone |
| `@analytical` | Step-by-step reasoning |
| `@intuitive` | Pattern-based reasoning |
| `@focused` | On-topic, narrow scope |
| `@exploratory` | Tangential, broad scope |
| `@grounded` | Evidence-based |
| `@speculative` | Hypothesis-based |
| `@strict` | Literal adherence |
| `@flexible` | Flexible interpretation |

### Mechanical

| Constraint | Effect |
|------------|--------|
| `@nomemory` | No conversation history |
| `@lastN[n=5]` | Keep last N messages only |

## Examples

```bash
# Basic
ctn send "Explain recursion"

# With constraints
ctn send "@precise @terse Explain recursion"

# Different provider
ctn send "@terse Hello" -p openai

# Specific model
ctn send "Hello" -p anthropic -m opus

# With grounding
ctn send "@terse Summarize this" --ground https://example.com/doc.md

# See the trace
ctn send "@precise @terse Hello" --trace

# Dry run (no API call)
ctn send "@precise @terse Hello" --dry-run

# Streaming
ctn send "@creative Tell me a story" --stream
```
