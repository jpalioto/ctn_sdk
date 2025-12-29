[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / OPERATIONAL\_CONSTRAINTS

# Variable: OPERATIONAL\_CONSTRAINTS

> `const` **OPERATIONAL\_CONSTRAINTS**: readonly [`ConstraintDefinition`](../type-aliases/ConstraintDefinition.md)[]

Defined in: [packages/language/src/strategy/operational/constraints.ts:27](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/constraints.ts#L27)

Built-in constraint definitions for the Operational strategy.

Design principle: Features are only used for MECHANICAL settings that cannot
be expressed through behavioral steering (e.g., context policies). All
behavioral intent is expressed through traits only - the model should choose
brevity/verbosity through steering, not truncation.

For hard token limits, use @tokens[n=256] explicitly (not implemented yet).

| Constraint    | Aliases                  | Effect                    |
|---------------|--------------------------|---------------------------|
|

## Precise

| deterministic, grounded  | v1:-0.5, v5:+0.5          |
|

## Creative

| exploratory              | v1:+0.5                   |
|

## Terse

| brief, concise           | v2:+0.5                   |
|

## Verbose

| detailed, thorough       | v2:-0.5                   |
|

## Formal

| —                        | v4:+0.5                   |
|

## Casual

| —                        | v4:-0.5                   |
|

## Analytical

| step-by-step, reasoning  | v5:+0.8                   |
|

## Strict

| compliant                | v6:+0.5                   |
|

## Flexible

| —                        | v6:-0.5                   |
|

## Nomemory

| isolated                 | context: none (mechanical)|
| @lastN[n=N]   | —                        | context.last: N (mech.)   |
