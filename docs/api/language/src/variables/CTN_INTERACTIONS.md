[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / CTN\_INTERACTIONS

# Variable: CTN\_INTERACTIONS

> `const` **CTN\_INTERACTIONS**: readonly [`TraitInteraction`](../type-aliases/TraitInteraction.md)[]

Defined in: [packages/language/src/strategy/ctn/interactions.ts:13](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/interactions.ts#L13)

Trait interactions for the CTN strategy.

| ID                   | Traits  | Condition   | Resolution | Rationale                           |
|----------------------|---------|-------------|------------|-------------------------------------|
| exploration-schema   | v6, v7  | both_high   | modify     | Schema constrains exploration       |
| structure-exploration| v4, v6  | both_high   | modify     | Structure limits exploration        |
| clarity-exploration  | v1, v6  | both_high   | modify     | Clarity bounds exploration          |
