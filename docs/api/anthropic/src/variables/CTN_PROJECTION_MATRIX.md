[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [anthropic/src](../README.md) / CTN\_PROJECTION\_MATRIX

# Variable: CTN\_PROJECTION\_MATRIX

> `const` **CTN\_PROJECTION\_MATRIX**: `ProjectionMatrix`

Defined in: [packages/anthropic/src/projection.ts:111](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/projection.ts#L111)

Projection matrix for the CTN strategy on Anthropic Claude models.

Maps the 7-dimensional CTN trait space to Anthropic API parameters.
CTN uses 0-1 range (0 = no constraint, 1 = maximum constraint).

CTN dimensions (v1.0.0):
  v1 (idx 0): Atomic Clarity       (0-1, higher = sharper concept boundaries)
  v2 (idx 1): Specification Accuracy (0-1, higher = smoother reasoning path)
  v3 (idx 2): Context Isolation    (0-1, higher = more focused)
  v4 (idx 3): Structure Over Narrative (0-1, higher = global consistency)
  v5 (idx 4): Framing Detachment   (0-1, higher = reject false premises)
  v6 (idx 5): Exploration          (0-1, higher = more exploratory)
  v7 (idx 6): Schema Compliance    (0-1, higher = structured output)

Weight rationale:

temperature:
  - v1 (-0.3): Higher clarity → lower temperature (more deterministic)
  - v2 (-0.2): Smoother paths → slightly lower temperature
  - v4 (-0.2): Structure → lower temperature
  - v6 (+0.5): Exploration → higher temperature

top_k:
  - v1 (+0.4): Higher clarity → narrower token pool
  - v4 (+0.3): Structure → narrower selection
  - v6 (-0.4): Exploration → broader token pool
  - v7 (+0.3): Schema compliance → focused tokens

Note: Baseline assumes moderate constraint (0.5 across dimensions).
Zero vector means "no constraints" so we use a neutral baseline.
