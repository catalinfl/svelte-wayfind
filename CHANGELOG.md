# Changelog

## 1.1.0

### ✨ Features

- **Svelte 5 component types** — `Router` and `Link` now expose proper `Component<Props>` types instead of the deprecated `SvelteComponentTyped`. No more deprecation warnings in your editor.
- **Renamed `AppRoute` → `Route`** — the public route type is now simply `Route`. The internal generic type from the trie has been renamed to `RouteDefinition`.
- **Ambient `*.svelte` declaration** — the library ships its own `declare module "*.svelte"` so TypeScript resolves `.svelte` imports out of the box.

### 🏗 Structure

- Source files reorganised:
  - `src/components/` — Svelte components (`Link.svelte`, `Router.svelte`) with hand-written `.d.ts` type declarations
  - `src/tests/` — test files (`cache.test.ts`, `trie.test.ts`)
  - `src/` root — plain `.ts` modules (`trie.ts`, `router.ts`, `store.ts`, etc.)

### 📖 Documentation

- README updated to reflect the new `Route` type name
- CHANGELOG added (hi there!)

### 🐛 Fixes

- `vite-plugin-dts` no longer generates deprecated `SvelteComponentTyped` stubs — type declarations now use Svelte 5's `Component` type with proper prop interfaces
