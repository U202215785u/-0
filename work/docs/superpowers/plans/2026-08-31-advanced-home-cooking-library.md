# Advanced Home Cooking Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a source-traceable, Chinese-first library of at least 50 practical high-skill home recipes, with an auditable source catalog and a Cooklang-ready structure.

**Architecture:** Use Markdown for the library index, source ledger, and usage guide. Use individual Cooklang files only where a public original source exposes enough quantitative information. Use direct original-source URLs as the provenance boundary; no secondary repost becomes a recipe source.

**Tech Stack:** Markdown, Cooklang plain-text recipe format, Git-compatible directory layout, public creator/organization webpages and videos.

## Global Constraints

- Minimum recipe catalog size: 50 entries.
- Chinese recipes are the majority; international recipes are supplemental and clearly labeled.
- Every entry includes a direct public original-source URL, creator/organization, access date, and fidelity status.
- Never copy or reconstruct paywalled, pirated, or unsourced recipes.
- Do not invent quantities, temperatures, or named-chef attribution.
- A public source with insufficient detail is a catalog entry, not a complete Cooklang recipe.

---

### Task 1: Create the Auditable Library Skeleton

**Files:**
- Create: `outputs/advanced-home-cooking-library/README.md`
- Create: `outputs/advanced-home-cooking-library/INDEX.md`
- Create: `outputs/advanced-home-cooking-library/SOURCES.md`
- Create: `outputs/advanced-home-cooking-library/templates/recipe-template.cook`
- Create: `outputs/advanced-home-cooking-library/templates/trial-template.md`

**Interfaces:**
- Produces: a stable catalog schema consumed by all research batches.

- [ ] **Step 1: Create the category taxonomy**

Use these categories: `stir-fry`, `braise`, `stew`, `steam`, `fry`, `soup`, `cold-dish`, `staple`, `bases`, and `international`.

- [ ] **Step 2: Define source and fidelity fields**

Every index row must contain: title, category, cuisine, source creator, direct URL, access date, home equipment, higher-skill focus, and one of `verbatim-public`, `structured-transcription`, or `source-summary`.

- [ ] **Step 3: Create the Cooklang template**

Use this metadata block:

```text
>> title: 
>> category: 
>> source_creator: 
>> source_url: 
>> accessed: 2026-08-31
>> fidelity: verbatim-public
>> yield: 
>> equipment: 
>> skill_focus: 
>> source_note: 
```

- [ ] **Step 4: Verify the skeleton**

Run: `rg -n "source_url|fidelity|skill_focus" outputs/advanced-home-cooking-library`

Expected: each template and index schema exposes the required provenance fields.

### Task 2: Collect Chinese Stir-Fry, Braise, and Steam Sources

**Files:**
- Modify: `outputs/advanced-home-cooking-library/INDEX.md`
- Modify: `outputs/advanced-home-cooking-library/SOURCES.md`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/stir-fry/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/braise/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/steam/*.cook`

**Interfaces:**
- Consumes: Task 1 categories and provenance fields.
- Produces: at least 20 cited Chinese main-dish entries.

- [ ] **Step 1: Locate public first-party cooking sources**

Prioritize named chefs, publishers, culinary schools, and restaurants that publish their own recipe pages or videos. Record the direct page/video URL before recording any recipe facts.

- [ ] **Step 2: Apply the admission test to every candidate**

Reject any candidate missing a named creator, a direct original page, or enough method detail to be useful. Mark remaining sources `source-summary` if they do not publicly disclose quantities.

- [ ] **Step 3: Balance coverage**

Target at least 8 stir-fries, 7 braises/stews, and 5 steamed dishes. Avoid more than two closely redundant variations of the same flavor profile.

- [ ] **Step 4: Create Cooklang recipes only for quantitative sources**

Transcribe only published quantities and steps. Preserve source attribution in the metadata block. Do not fill gaps with estimated amounts.

- [ ] **Step 5: Verify citations**

Run: `rg -n "https://|source_url" outputs/advanced-home-cooking-library/INDEX.md outputs/advanced-home-cooking-library/recipes/chinese`

Expected: every complete recipe and every catalog row contains a direct source link.

### Task 3: Collect Fried, Soup, Cold-Dish, Staple, and Base Sources

**Files:**
- Modify: `outputs/advanced-home-cooking-library/INDEX.md`
- Modify: `outputs/advanced-home-cooking-library/SOURCES.md`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/fry/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/soup/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/cold-dish/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/chinese/staple/*.cook`
- Create: `outputs/advanced-home-cooking-library/recipes/bases/*.cook`

**Interfaces:**
- Consumes: Task 1 source controls.
- Produces: at least 25 additional Chinese entries, including reusable building blocks.

- [ ] **Step 1: Collect technique-diverse sources**

Seek explicit details for oil temperature, blanching, stock, aroma oil, starch slurry, emulsification, or fermentation when they are present in the original source.

- [ ] **Step 2: Balance coverage**

Target at least 6 fried/pan-fried dishes, 6 soups, 5 cold dishes, 5 staples, and 3 reusable bases.

- [ ] **Step 3: Record practical constraints**

For each entry, state the required household equipment and any ingredient that needs advance ordering. This is an execution aid, not an alteration of the source recipe.

- [ ] **Step 4: Verify category coverage**

Run: `rg -n "\| (fry|soup|cold-dish|staple|bases) \|" outputs/advanced-home-cooking-library/INDEX.md`

Expected: the index meets each category minimum.

### Task 4: Add a Small International Technique Section

**Files:**
- Modify: `outputs/advanced-home-cooking-library/INDEX.md`
- Modify: `outputs/advanced-home-cooking-library/SOURCES.md`
- Create: `outputs/advanced-home-cooking-library/recipes/international/*.cook`

**Interfaces:**
- Consumes: Task 1 source controls.
- Produces: 5-8 supporting recipes that develop transferable techniques.

- [ ] **Step 1: Select transferable skills**

Choose home-friendly recipes that develop searing, pan sauce, roasting, pasta emulsification, curry balance, or temperature-controlled proteins.

- [ ] **Step 2: Preserve the Chinese-first composition**

Keep international entries at no more than 16% of the first 50 entries.

- [ ] **Step 3: Verify the total**

Run: `rg -n '^\| [0-9]+' outputs/advanced-home-cooking-library/INDEX.md`

Expected: at least 50 numbered recipe rows, of which at least 42 are Chinese.

### Task 5: Document Installation, Use, and Trial Workflow

**Files:**
- Modify: `outputs/advanced-home-cooking-library/README.md`
- Create: `outputs/advanced-home-cooking-library/trials/README.md`

**Interfaces:**
- Consumes: Task 1 library structure and Cooklang template.
- Produces: self-contained instructions for browsing, cooking, scaling, and logging changes.

- [ ] **Step 1: Explain the two supported use modes**

Document Cooklang as the canonical editable source and Tandoor/Mealie as optional kitchen-facing interfaces for meal planning and browsing.

- [ ] **Step 2: Define the cooking workflow**

Require the cook to check the original source, choose the required yield, prepare mise en place, cook with timers, and log only observed differences after the attempt.

- [ ] **Step 3: Explain source fidelity labels**

`verbatim-public` means original quantities and method are public; `structured-transcription` means public content was structured without adding facts; `source-summary` means follow the original source for full detail.

- [ ] **Step 4: Verify handoff quality**

Run: `rg -n "Cooklang|Tandoor|Mealie|source-summary|trial" outputs/advanced-home-cooking-library/README.md`

Expected: the README describes installation alternatives, source fidelity, and the trial process.

### Task 6: Final Audit

**Files:**
- Modify: `outputs/advanced-home-cooking-library/INDEX.md`
- Modify: `outputs/advanced-home-cooking-library/SOURCES.md`

**Interfaces:**
- Consumes: all collected entries.
- Produces: a delivery-ready library with traceable sources.

- [ ] **Step 1: Audit every row for provenance**

Confirm no recipe row lacks creator, direct URL, access date, category, and fidelity status.

- [ ] **Step 2: Audit for unsupported claims**

Search for terms such as `chef`, `restaurant`, and `SOP`; remove or qualify any claim that its cited source does not establish.

- [ ] **Step 3: Audit coverage and duplicates**

Confirm category counts meet Tasks 2-4 and that no two entries are duplicate dish variants without a clear technique distinction.

- [ ] **Step 4: Report verification**

Run: `rg -c '^\| [0-9]+' outputs/advanced-home-cooking-library/INDEX.md`

Expected: a count of 50 or more.
