[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [anthropic/src](../README.md) / OPERATIONAL\_PROJECTION\_MATRIX

# Variable: OPERATIONAL\_PROJECTION\_MATRIX

> `const` **OPERATIONAL\_PROJECTION\_MATRIX**: `ProjectionMatrix`

Defined in: [packages/anthropic/src/projection.ts:37](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/projection.ts#L37)

Projection matrix for the Operational strategy on Anthropic Claude models.

Maps the 7-dimensional trait space to Anthropic API parameters:
- temperature: Controls randomness (0-1)
- top_k: Limits token sampling pool (1-100+)

Note: Claude 4.5 models don't support temperature + top_p together,
so we only use temperature and top_k for sampling control.

Trait dimensions (Operational v1.0.0):
  v1 (idx 0): Stochasticity     (-1 = deterministic, +1 = creative)
  v2 (idx 1): Concision         (-1 = verbose, +1 = terse)
  v3 (idx 2): Agency            (-1 = reactive, +1 = proactive)
  v4 (idx 3): Formality         (-1 = casual, +1 = formal)
  v5 (idx 4): Reasoning         (-1 = intuitive, +1 = analytical)
  v6 (idx 5): Compliance        (-1 = flexible, +1 = strict)
  v7 (idx 6): Context Density   (-1 = minimal, +1 = heavy)

Weight rationale:

temperature:
  - v1 (+0.6): Primary driver - creative intent increases temperature
  - v5 (-0.4): Analytical reasoning benefits from lower temperature
  - v6 (-0.2): Strict compliance slightly reduces randomness

top_k:
  - v1 (-0.5): Creative intent expands token pool (lower top_k restriction)
  - v5 (+0.3): Analytical reasoning narrows to likely tokens
  - v6 (+0.4): Strict compliance narrows token selection

Note: v2-v4, v7 have no direct API parameter mapping for Claude.
Their semantic intent is expressed via the kernel (system prompt).
