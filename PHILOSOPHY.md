# Why CTN Exists

## The Misunderstanding

When models see CTN notation, they often respond:

> "This appears to be pseudo-mathematical notation. I cannot execute these instructions."

> "This looks like a formal specification language, but I don't have the ability to process it."

They're right. And they're missing the point.

## The Reality

**There is no magic here.**

CTN doesn't give models new capabilities. It doesn't unlock hidden features. It doesn't bypass safety systems. It doesn't execute code.

CTN is just tokens. Tokens in are tokens in.

Everything CTN does can be done with natural language. We're not claiming otherwise.

## So What's the Point?

### 1. Structured Thinking About Inputs

LLM behavior is determined by inputs. Yet most users treat prompts as incantations—try something, see what happens, tweak randomly, hope for the best.

CTN provides a **framework for thinking systematically** about the input space:

- What dimensions of behavior can we influence?
- How do those dimensions interact?
- What happens when we combine multiple intentions?
- How do abstract intentions map to concrete API parameters?

The framework may be wrong. The specific dimensions may be wrong. The projection matrices are definitely unvalidated. But the *approach*—systematic exploration of the input space—is what matters.

### 2. Pulling Back the Curtain

Run this:

```bash
ctn send "@precise @terse Explain recursion" --trace
```

You'll see:

```
Trait Vector:
  v1: -0.500    # Stochasticity → deterministic
  v2: +0.500    # Concision → terse
  v5: +0.500    # Reasoning → analytical

Projected API Parameters:
  temperature: 0.7500
  top_k: 52.0000

Kernel:
<behavioral_constraints>
  <constraint id="v1">Moderately favor deterministic responses</constraint>
  <constraint id="v2">Moderately favor brief, dense responses</constraint>
  <constraint id="v5">Moderately favor step-by-step reasoning</constraint>
</behavioral_constraints>
```

That's it. That's the whole trick.

- A vector of numbers representing intent
- A linear projection to API parameters
- Some text injected into the system prompt

No magic. No hidden capabilities. Just **visibility into what's actually being sent**.

### 3. A Playground for Understanding

The CLI is fun. You can play with it:

```bash
# What does @creative actually do?
ctn send "@creative Hello" --trace

# What happens when constraints oppose each other?
ctn send "@creative @precise Hello" --trace

# How does composition work?
ctn send "@terse @verbose Hello" --trace  # They cancel out
```

Each experiment shows you exactly what changed. You build intuition about:

- How constraints combine (vector addition)
- How saturation works (can't exceed the unit ball)
- How abstract intent becomes concrete parameters
- What the model actually receives

This isn't a production tool. It's an **exploration tool**.

## What We're Actually Claiming

### We Claim (Proven)

✅ The composition algebra is mathematically sound
- Associative: grouping doesn't matter
- Commutative: order doesn't matter  
- Bounded: results stay in the unit ball
- These properties are proven by 251 tests

✅ The architecture cleanly separates concerns
- Strategy defines the trait space
- Language layer handles composition
- Providers handle projection and API specifics
- Extension points are well-defined

✅ The system is fully observable
- Every transformation is traceable
- You can see exactly what gets sent
- No hidden state

### We Do NOT Claim (Hypotheses)

❓ That the 7 dimensions are the "right" dimensions
- They're hypotheses based on intuition
- They need empirical validation
- The CTN Testing project aims to validate them

❓ That the projection matrices produce meaningful steering
- The weight values are semantic guesses
- They exist to demonstrate the architecture
- Actual calibration requires experimentation

❓ That kernel clauses effectively influence behavior
- We don't know if `<constraint id="v1">...</constraint>` does anything
- It might be pure placebo
- Or the temperature change might be doing all the work
- Ablation studies needed

❓ That this is better than just writing good prompts
- Maybe natural language is fine
- Maybe structure provides no benefit
- That's an empirical question

## The Deeper Motivation

### Stabilizing Output Through Better-Defined Input

LLM outputs are high-variance. The same prompt can produce wildly different responses. Users cope through:

- Trial and error
- "Prompt engineering" folklore
- Cherry-picking outputs
- Hoping for the best

We hypothesize that **better-specified input leads to more stable output**. Not by magic—by giving the model more information about what we want.

CTN is one attempt to specify input more precisely. The pseudo-math notation isn't for the model—it's for us. It forces us to think:

- What do I actually want?
- Along which dimensions?
- At what intensity?
- How do my intentions interact?

Whether the model "understands" the notation is irrelevant. What matters is whether structured specification produces more predictable results than unstructured prose.

### Tokens Are Just Tokens

Here's the thing models don't get when they say "I can't execute this":

They *are* executing it. Every token influences the probability distribution over next tokens. There's no difference between:

```
Be precise and analytical.
```

and

```
<constraint id="v1">Favor deterministic responses</constraint>
<constraint id="v5">Favor analytical reasoning</constraint>
```

Both are just tokens that shift the distribution. The second isn't "executable" in any special sense. It's just more structured, more explicit, more inspectable.

The model's confusion reveals something important: even models don't understand their own mechanics. They pattern-match "formal notation" to "code execution" and conclude they can't help.

But they can. They're already processing every token. CTN just makes that process visible.

## What Success Looks Like

This project succeeds if:

1. **People understand what's happening** — The trace shows the machinery. No mystery.

2. **The approach proves worth pursuing** — Empirical validation shows structured input produces more stable output than unstructured.

3. **The framework enables experimentation** — Others can test different dimensions, different projections, different providers.

4. **We learn something** — Even if CTN "fails," we learn that structured input doesn't help, which is valuable.

This project fails if:

1. **People think it's magic** — It's not. It's just tokens.

2. **The projection matrices get cargo-culted** — They're placeholders, not ground truth.

3. **We claim validation we don't have** — The steering hypothesis is unproven.

## Current Status

**Proof of Concept**

- Architecture: ✅ Demonstrated
- Algebra: ✅ Proven
- Steering: ❓ Hypothesis
- Calibration: ❌ Not done
- Validation: ❌ Pending (CTN Testing project)

The CLI is a toy for building intuition. The framework is a scaffold for experimentation. The numbers are starting points for calibration.

That's where we are. That's what we're sharing. Feedback welcome.

---

## Try It

```bash
pnpm add @ctn/cli
export ANTHROPIC_API_KEY=sk-ant-...

# See the machinery
ctn send "@precise Explain recursion" --trace

# Play with composition
ctn send "@creative @analytical Tell me a story" --trace

# See cancellation
ctn send "@terse @verbose Hello" --trace
```

Pull back the curtain. See what's actually happening. Form your own hypotheses.