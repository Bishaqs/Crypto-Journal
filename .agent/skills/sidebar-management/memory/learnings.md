# Sidebar Management — Learnings

## Sidebar Architecture (crypto-journal)

### Key files
- **Config:** `src/components/sidebar/sidebar-data.ts` — all nav items, sections, rail categories, i18n key maps, path mapping
- **Rail:** `src/components/sidebar/sidebar-rail.tsx` — left icon strip (iterates `RAIL_CATEGORIES`)
- **Drawer:** `src/components/sidebar/sidebar-drawer.tsx` — expanded panel when rail icon clicked
- **Mobile:** `src/components/sidebar/sidebar-mobile.tsx` — full mobile nav (uses `getResolvedCoreItems()` flat list)
- **i18n:** `src/lib/i18n/translations/{en,de,es,fr,pt,ar,hi,ru,ja,ko,zh,tr}.ts` — 12 translation files

### How RAIL_CATEGORIES and coreItems work together
- `coreItems` is a flat array of `NavItem` objects (index 0–8)
- `RAIL_CATEGORIES` references items by array index: `coreItems[1]`, `coreItems[6]`, etc.
- Each rail category has a `key`, `label`, `icon`, and `items` array
- Categories can also have `sections` (collapsible groups with sub-items) and `directNav` (skip drawer, navigate directly)
- When moving items between categories, update the `items` array references — don't reorder `coreItems` itself

### getCategoryForPath() — route-to-section mapping
- Maps URL pathname to a rail category key (`"home"`, `"journal"`, `"analytics"`, `"tools"`, `"compete"`)
- Uses prefix arrays with `pathname.startsWith()` matching
- **Critical:** When moving items to a new category, you must also move their route prefixes from the old category's prefix array to the new one — otherwise the sidebar highlight stays on the old category

### i18n checklist for adding new sidebar keys
1. Add item label to `LABEL_KEY` map in `sidebar-data.ts` (maps display label → i18n key)
2. Add section label to `SECTION_KEY` map if adding a new section/category
3. Update ALL 12 translation files — they all follow the same structure at the same line numbers
4. Non-English files were missing `achievements` key entirely (bug) — always verify all keys exist across all files

### Asset context resolution
- `resolveItems()` filters items based on `assetContext` ("crypto" | "stocks")
- `getResolvedCoreItems()` remaps labels for stocks context (e.g., "Trade Log" → "Positions")
- Gamification items (Quests, Achievements, Leaderboard) are NOT affected by asset context

### 2026-03-06: Moved gamification to "Compete" section
- Moved Challenges (renamed to "Quests"), Achievements, Leaderboard from "journal" to new "compete" rail category
- Added Trophy icon for the compete rail
- Fixed missing `sidebar.challenges` i18n key (replaced with `sidebar.quests`)
- Added `quests`, `achievements`, `compete` keys to all 12 translation files
