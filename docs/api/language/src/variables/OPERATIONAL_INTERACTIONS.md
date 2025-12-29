[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / OPERATIONAL\_INTERACTIONS

# Variable: OPERATIONAL\_INTERACTIONS

> `const` **OPERATIONAL\_INTERACTIONS**: readonly [`TraitInteraction`](../type-aliases/TraitInteraction.md)[]

Defined in: [packages/language/src/strategy/operational/interactions.ts:17](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/interactions.ts#L17)

Trait interactions for the Operational strategy.

From specification Appendix A.2:
| ID                  | Traits  | Condition   | Resolution | Rationale                    |
|---------------------|---------|-------------|------------|------------------------------|
| creative-analytical | v1, v5  | both_high   | priority(v5) | Analytical requires determinism |
| creative-compliance | v1, v6  | both_high   | modify     | Balance creative exploration |
| agency-compliance   | v3, v6  | both_high   | priority(v6) | Compliance for safety        |

Evaluation order: Top to bottom. First match for a trait pair wins.
Non-expansive guarantee: All defined resolutions either zero traits or leave them unchanged.
