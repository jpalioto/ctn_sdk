# Getting Started with CTN

## Setup

```bash
pnpm add @ctn/cli
export ANTHROPIC_API_KEY=sk-ant-...
```

## Your First Request

```bash
ctn send "Hello world"
```

That's it. You just sent a request to Claude with default settings.

## Add a Constraint

```bash
ctn send "@terse Hello world"
```

Notice the response is shorter now. The `@terse` constraint steered the model toward brevity.

Try the opposite:

```bash
ctn send "@verbose Hello world"
```

Now you get a longer, more detailed response.

## Stack Constraints

Constraints compose. Add more to layer behaviors:

```bash
ctn send "@terse @precise Explain recursion"
```

This asks for a brief *and* deterministic explanation. The model aims for both.

What happens with opposing constraints?

```bash
ctn send "@terse @verbose Hello"
```

They cancel out. You get balanced output.

## See What Changed

Use `--trace` to see how constraints affect the request:

```bash
ctn send "@terse @precise Hello" --trace
```

Output shows:
- **Trait Vector**: The numeric representation of your constraints
- **Projected Parameters**: What temperature, top_k, etc. were set
- **Kernel**: The behavioral instructions injected into the prompt

Now you can see exactly what CTN does. No magic.

## Try Another Provider

Same constraints, different provider:

```bash
# Google Gemini
export GEMINI_API_KEY=your-key
ctn send "@terse Hello" -p google

# OpenAI GPT-5
export OPENAI_API_KEY=your-key
ctn send "@terse Hello" -p openai
```

The constraint means the same thing. CTN translates it to each provider's parameters.

## Pick a Model

Each provider has multiple models:

```bash
# Claude Opus (more capable)
ctn send "@analytical Solve this puzzle" -m opus

# Gemini Pro
ctn send "@analytical Solve this puzzle" -p google -m pro

# GPT-5.2
ctn send "@analytical Solve this puzzle" -p openai -m gpt
```

## Add External Context

Ground your request with content from a URL:

```bash
ctn send "@terse Summarize this" --ground https://example.com/article.md
```

CTN fetches the URL, includes it as context, and your prompt operates on that content.

## Dry Run

See what would be sent without making an API call:

```bash
ctn send "@precise @terse Hello" --dry-run
```

Useful for debugging or understanding the projection.

## Streaming

Watch tokens appear as they're generated:

```bash
ctn send "@creative Tell me a story" --stream
```

## Common Patterns

**Quick answers:**
```bash
ctn send "@terse @precise What is the capital of France?"
```

**Detailed analysis:**
```bash
ctn send "@verbose @analytical Review this code" --ground ./file.ts
```

**Creative writing:**
```bash
ctn send "@creative @exploratory Write a poem about rain" --stream
```

**Strict formatting:**
```bash
ctn send "@strict @formal Output as JSON: list 3 colors"
```

## What's Next

- See [CLI Reference](../cli/README.md) for all options
- Read [PHILOSOPHY.md](../../PHILOSOPHY.md) for why CTN exists
- Check [CONTRIBUTING.md](../../CONTRIBUTING.md) to add your own constraints
