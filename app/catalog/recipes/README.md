# Curated Recipe Rules

- Preserve source facts. Do not invent or normalize away information from the source.
- Do not fill missing amounts. Use `quantityText` for quantities that are not numeric.
- Use a stable `mergeKey` only when ingredients are equivalent grocery items.
- Do not mark a source-index entry cookable until it has both ingredients and steps.

Recipe records are validated by the canonical parser in `app/src/catalog/schema.ts`. Runtime editing and source-index placeholders are outside this format.
