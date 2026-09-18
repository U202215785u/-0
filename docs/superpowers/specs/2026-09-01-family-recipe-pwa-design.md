# Family Recipe PWA Design

## Goal

Build a cross-platform, local-first PWA for two people to use a curated recipe
library. It should make three everyday tasks easy: find a dish and cook it,
arrange a weekly menu, and produce a simple shopping list. The recipe library
is source-based; the app must not invent recipes or fetch recipe pages.

## Scope and Constraints

- Chinese home cooking is the primary content; international recipes are a
  small supplement.
- The curated library currently contains 1,193 source-based entries (1,108
  baseline plus 85 common homestyle dishes added in the 2026-09-18 round).
- Recipe data is read-only inside the app. New and corrected recipes arrive
  only in a later app release.
- The app is local-first, requires no account, backend, cloud sync, or AI.
- It runs offline after installation. It must work on phone and desktop.
- The user manages menus and shopping. His wife only browses and chooses
  dishes on her own device.
- This is a household tool. Do not add authentication, encryption, signing,
  audit logs, or other security-heavy systems.
- Visual styling will follow a reviewed Apple/HIG-oriented design skill when
  that skill can be installed; the current platform gateway has blocked that
  installation attempt.

## Technical Direction

Use React, TypeScript, Vite, and a PWA service worker. Package the released
recipe catalog as static application data. Store per-device user data in local
browser storage with a schema version, separate from the catalog:

- favorites and want-to-eat selections;
- weekly meal plan;
- shopping-list completion state and manual additions;
- device mode: `cook` or `choose`;
- imported selections.

Catalog changes in a new release must not overwrite any of this local data.
No server-side or live device synchronization is included.

## Recipe Content Model

Each recipe has a stable ID plus a title, at least one ingredient, and at least
one cooking step. All other fields are optional:

- category, tags, duration, source URL, author, nutrition estimate, and health
  tags;
- a base serving count;
- per-ingredient numeric amount and unit.

The cooking screen offers a target serving count, defaulting to two. When a
recipe declares a base serving count, numeric ingredient amounts scale by the
target-to-base ratio. Text quantities such as "to taste" remain unchanged. A
recipe without a base serving count stays usable but has no automatic scaling.

Source and author are shown only when available. Existing source provenance is
kept whenever it exists. Nutrition values are estimates, never medical advice;
recipes without nutrition data show "no estimate available" and are excluded
from applicable nutrition totals rather than being guessed.

## User Flows

### Find and cook

The home screen is recipe-first. Users can search by dish name, ingredient, or
technique with fuzzy matching (missing/wrong characters tolerated, plus pinyin
syllables and initials), then filter by cooking method, duration, fat-loss
friendliness, calories, and protein. A card shows available time and nutrition
summary.

Recipe detail shows ingredients, steps, source information when present, and
nutrition when present. The user can set servings, add the dish to a specified
lunch or dinner slot, or start cooking.

On phone, cooking mode shows one active step with its relevant ingredients and
an optional step timer. On desktop, ingredients stay visible beside the step
list. The full recipe remains accessible without leaving the cooking session.

### Weekly menu and nutrition

The weekly planner defaults to lunch and dinner. Breakfast and snacks may be
added only when useful. It summarizes known calorie, protein, carbohydrate,
and fat estimates for planned dishes, while clearly identifying any dishes
that lack nutrition data.

### Shopping list

The shopping list is deliberately minimal. It generates from the weekly plan,
groups major ingredients by grocery category, and merges only the same
ingredient with the same unit. It does not attempt unreliable unit conversion.
Oil, salt, sauces, and staple seasonings are excluded by default. Users tap an
item to mark it purchased and can add a simple manual item. There is no pantry
or household inventory system.

### Two-person handoff

The choosing device exposes browse, want-to-eat, and send-selection actions;
editing menus and shopping is hidden. Sending produces a human-readable text
code containing selected recipe IDs. It can be shared in WeChat. The cooking
device pastes the text into an import screen, which adds recognized recipes to
an import inbox. Invalid text and missing recipe IDs show a plain error and do
not modify the menu.

## Interface Direction

On mobile, the cooking device uses a small bottom navigation with recipe
browse, weekly menu, shopping list, and settings. On desktop, these areas move
to a compact sidebar and the extra width is used for detail and planning views.
The choosing device reduces this to browse, want-to-eat, and send selection.

The interface favors direct actions, visible nutrition context, and a simple
shopping checklist over dashboards or settings-heavy workflows.

## Recipe Maintenance Pipeline

Recipe source files live outside the installed app. A release build validates
required content, unique IDs, and ingredient structure, then generates the
static catalog bundled by the PWA. It must accept optional metadata and reject
only structurally unusable recipes, such as recipes without a title,
ingredients, or steps.

No import editor, AI parser, or website scraper is included in the app.

## Validation

Before release, verify:

1. Search and filters find catalog recipes correctly.
2. Serving adjustments scale only supported numeric ingredients.
3. Menu changes generate the expected grouped shopping list.
4. Shopping item completion and manual additions persist locally.
5. Selection code export and import handle valid, malformed, and unknown
   recipes without corrupting local data.
6. Cooking mode navigation and timers behave on mobile and desktop layouts.
7. The PWA opens with cached content offline and preserves user data after a
   catalog update.

## Out of Scope

- Accounts, cloud synchronization, invitations, or shared live data.
- In-app recipe editing, importing, web scraping, or AI recognition.
- Pantry inventory, automatic unit conversion, and nutrition diagnosis.
- Recipe content generated without a supplied source.
