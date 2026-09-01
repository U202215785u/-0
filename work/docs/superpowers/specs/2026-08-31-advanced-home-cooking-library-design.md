# Advanced Home Cooking Library Design

## Goal

Build a source-traceable, Chinese-cooking-first recipe library of at least 50 practical, chef-informed home dishes. The library must improve repeatability without presenting rewritten or inferred recipes as if they came from the source.

## Scope

- Chinese food is the primary collection. A small, clearly separate international section supports useful home techniques.
- Coverage must include stir-fry, braise, stew, steam, pan-fry/deep-fry, soups, cold dishes, staple foods, and reusable bases.
- Each recipe must be convenient for a home kitchen and include a direct public original source from a named cook, restaurant, publisher, or cooking organization.
- The collection will cite and link to original content. It will not copy paywalled material, pirated scans, or unsourced reposts.

## Source Admission Rules

Each entry requires all of the following:

1. A direct, public URL for the original recipe or the creator's own published video/page.
2. An identifiable creator or organization.
3. Ingredient quantities, a demonstrable method, or explicit technique details sufficient for repeatable home cooking.
4. A useful higher-skill element, such as ingredient prep, temperature control, sauce sequencing, stock, thickening, oil temperature, or timing.
5. A suitability note that explains required equipment and why it remains approachable at home.

Entries are excluded when they are only a repost, have no named source, require inaccessible proprietary details, or merely show food without enough method to reproduce it.

## Information Model

The canonical recipe format is Cooklang (`.cook`) so it can be versioned, scaled, timed, and rendered by community tools. A Markdown source registry and index keep audit data that is not naturally represented in a basic recipe file.

Every recipe records:

- title, category, cuisine, yield, estimated active time, and equipment;
- direct original-source URL, creator/organization, and access date;
- original-source fidelity status: `verbatim-public`, `structured-transcription`, or `source-summary`;
- ingredients and quantities only when publicly provided by the original source;
- process steps, temperatures, timing, and sensory checkpoints attributed to the source;
- home-kitchen notes that are clearly marked as execution aids, not source claims;
- a revision log for later cooking trials.

## Directory Structure

```text
advanced-home-cooking-library/
  README.md
  INDEX.md
  SOURCES.md
  recipes/
    chinese/
      stir-fry/
      braise/
      stew/
      steam/
      fry/
      soup/
      cold-dish/
      staple/
    international/
    bases/
  trials/
  templates/
```

## Workflow

1. Browse the index and choose a dish by category or available time.
2. Open the original source before cooking when an entry is a `source-summary`.
3. Use the Cooklang recipe for measured ingredients, timers, scaled servings, and prep order.
4. Record a trial only after cooking; do not overwrite the cited source method.
5. Promote a variation to a new version only after its source and test notes are recorded.

## Delivery

The first delivery contains the repository structure, setup/use guide, a source registry, and a curated catalog of at least 50 recipes with direct original-source links and collection-status fields. Fully structured Cooklang files are created only for sources that disclose sufficient public quantitative detail.

## Boundaries

- This is a personal recipe management library, not a public mirror of creators' work.
- The library stores citations, short operational notes, and links; original video, text, photography, and paywalled recipes remain at their source.
- No recipe will be labeled a restaurant or chef SOP without a public source that substantiates that label.
