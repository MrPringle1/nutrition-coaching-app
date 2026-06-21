# Food Import Strategy

This document describes how foods are imported, normalized, deduplicated, searched, and scaled in the NutriCoach platform (schema v3, `foods` table).

## 1. CSV Import Format

### Required columns
| Column | Type | Notes |
|--------|------|-------|
| `name` | text | Display name, e.g. `Chicken Breast (raw, skinless)` |
| `serving_size` | numeric | Numeric size of one serving |
| `serving_unit` | text | `g`, `ml`, `oz`, `slice`, `scoop`, etc. |
| `calories` | numeric | Per serving |
| `protein` | numeric | Grams per serving |
| `carbs` | numeric | Grams per serving |
| `fat` | numeric | Grams per serving |

### Optional columns
`brand`, `barcode`, `category` (slug), `grams_per_serving`, `saturated_fat`,
`polyunsaturated_fat`, `monounsaturated_fat`, `trans_fat`, `cholesterol`,
`sodium`, `potassium`, `fiber`, `sugar`, `vitamin_a`, `vitamin_c`, `calcium`,
`iron`, `image_url`, `source`, `is_verified`.

Missing optional numerics default to `0` via the column defaults. `category_id`
should be resolved from the `category` slug at import time:
`(SELECT id FROM food_categories WHERE slug = :category)`.

## 2. Name Normalization

`normalized_name` is a **generated column** (`LOWER(TRIM(name))`) so it is always
consistent and never needs to be set by the importer. For matching and dedup, the
client also applies `normalizeFoodName()` (`lib/food-matching.ts`) which lowercases,
trims, strips punctuation, and collapses whitespace. Use the same routine when
preparing import rows so external names line up with stored values.

## 3. Deduplication

Treat a food as a duplicate when the tuple
**(`normalized_name`, `brand`, `serving_size`)** already exists.

Recommended import flow:
1. Stage rows in a temp table.
2. `LEFT JOIN` against `foods` on the dedup tuple.
3. Insert only rows with no match; optionally `UPDATE` verified/nutrition fields on matches.

A partial unique index can enforce this for system foods:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_food_dedup
  ON foods (normalized_name, COALESCE(brand,''), serving_size)
  WHERE source = 'system';
```
Barcodes give a stronger key — when a `barcode` is present, dedup on barcode first.

## 4. Full-Text Search

`foods.search_vector` (tsvector) is maintained by the `trg_foods_search` trigger on
INSERT/UPDATE, concatenating `name + brand + category`. Queries use the GIN index
`idx_foods_search`. For typo tolerance and prefix matching, `idx_foods_name_trgm`
(pg_trgm) supports `ILIKE '%q%'` and similarity ranking. The app combines both:
exact/prefix matches rank highest (see `searchFoods()`).

## 5. Barcode Import (UPC-A / EAN-13)

- Store the digits-only barcode in `foods.barcode` (indexed by `idx_foods_barcode`).
- UPC-A is 12 digits; EAN-13 is 13 digits (a UPC-A prefixed with `0`). Normalize to
  EAN-13 on import so the same product matches regardless of source format.
- The `/api/scan/barcode` route looks up `foods` by exact `barcode`.

## 6. Image Import

- `image_url` may point to a CDN/storage URL. Prefer hosting in Supabase Storage to
  avoid hotlinking and broken third-party links.
- The UI degrades gracefully: `FoodImage` falls back to a category emoji + colored
  tile when no image is present or loading fails, so `image_url` is always optional.

## 7. Scaling to 1M+ Foods

- **Indexing**: the GIN trigram + tsvector indexes already cover search. Keep
  `is_public`/`is_verified` partial indexes for the common filtered queries.
- **Partitioning**: partition `foods` by `source` (system / imported / user) or by
  first letter of `normalized_name` (hash/range) once the table is large.
- **Caching**: cache top search results and category listings (e.g. in a CDN/edge
  cache or a `materialized view` of verified public foods refreshed nightly).
- **Read path**: serve search from a read replica; importers write to primary.
- **Batch imports**: use `COPY` into a staging table, then set-based dedup + insert,
  rather than row-by-row inserts.

## 8. USDA FoodData Central Import

1. Download the FDC "Foundation" and "SR Legacy" CSV/JSON datasets.
2. Map FDC nutrient IDs to columns (e.g. 1008 → calories, 1003 → protein,
   1005 → carbs, 1004 → fat, 1079 → fiber, 2000 → sugar, 1093 → sodium,
   1253 → cholesterol, 1092 → potassium).
3. FDC values are per 100 g — set `serving_size = 100`, `serving_unit = 'g'`,
   `grams_per_serving = 100`.
4. Set `source = 'imported'`, `is_verified = true` (USDA is authoritative).
5. Run dedup against existing names before insert.

## 9. Open Food Facts Barcode Database

1. Use the OFF data dump or product API (`/api/v2/product/{barcode}.json`).
2. Map `product_name`, `brands`, `nutriments` (per 100 g) to columns.
3. Store the EAN-13 barcode. Mark `source = 'imported'`,
   `is_verified = false` (crowd-sourced — flag for review).
4. De-dupe on barcode first, then on the name/brand/serving tuple.

## 10. Verified vs Imported vs User-Created

| `source` | `is_verified` | Meaning |
|----------|---------------|---------|
| `system` | `true` | Hand-curated seed foods (this repo's `seed-foods.sql`) |
| `imported` | `true` | USDA / authoritative datasets |
| `imported` | `false` | Open Food Facts / crowd data — needs review |
| `coach` | coach's choice | Coach-added foods for their clients |
| `client` | `false` | Client custom/quick-add foods |

RLS: public foods (`is_public AND is_active`) are readable by all authenticated
users; creators retain full control of rows where `created_by = auth.uid()`.
Promote crowd-sourced foods to `is_verified = true` only after manual review.
