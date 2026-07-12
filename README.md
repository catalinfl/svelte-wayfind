# svelte-wayfind

> High-performance Svelte 5 router with trie-based route matching and backtracking.

## Features

- **Trie-based routing** — routes are compiled into a prefix trie once at boot, not re-parsed on every navigation
- **Backtracking matcher** — correctly resolves ambiguous paths where greedy descent would fail (e.g. `/a/x/b` matches `/a/:x/b` even when `/a/x/c` also exists)
- **Priority order** — `static > parametric > wildcard` on every level
- **Path parameters** — `/user/:id` → `{ id: "42" }` extracted during descent
- **Wildcards** — `/files/*` captures the rest of the path
- **Lazy loading** — code-split route components with `lazy()`
- **Cached matching** — last resolved path is cached, repeated matches are O(1)
- **History API** — `pushState` / `popstate` wrapper with scroll restoration
- **Reactive store** — Svelte store that updates on navigation
- **TypeScript** — full type safety, `.d.ts` generated for consumers
- **Tiny** — ~3 kB gzipped, Svelte runtime is external (not bundled)

## Install

```bash
npm install svelte-wayfind
```

## Quick start

```svelte
<script lang="ts">
    import { Router, Link, lazy, type AppRoute } from "svelte-wayfind";
    import Home from "./pages/Home.svelte";
    import About from "./pages/About.svelte";
    import NotFound from "./pages/NotFound.svelte";

    const User = lazy(() => import("./pages/User.svelte"));

    const routes: AppRoute[] = [
        { path: "/", handler: Home },
        { path: "/about", handler: About },
        { path: "/user/:id", handler: User },
        { path: "/user/:id/settings", handler: lazy(() => import("./pages/Settings.svelte")) },
        { path: "/blog/*", handler: lazy(() => import("./pages/Blog.svelte")) },
    ];
</script>

<nav>
    <Link to="/">Acasă</Link>
    <Link to="/about">About</Link>
    <Link to="/user/42">User 42</Link>
    <Link to="/blog/2024/01/hello">Blog</Link>
</nav>

<Router {routes} notFound={NotFound} />
```

## Route patterns

| Pattern | Example match | Params |
|---|---|---|
| `/` | `/` | `{}` |
| `/about` | `/about` | `{}` |
| `/user/:id` | `/user/42` | `{ id: "42" }` |
| `/user/:id/posts/:postId` | `/user/42/posts/7` | `{ id: "42", postId: "7" }` |
| `/files/*` | `/files/docs/readme.md` | `{ "*": "docs/readme.md" }` |

### Priority

On the same trie level, matching tries in order:

1. **Static** child (exact segment match)
2. **Parametric** child (`:id`)
3. **Wildcard** child (`*`)

If a higher-priority branch fails deeper in the tree, the matcher **backtracks** and tries the next branch. This prevents false 404s on valid paths like `/a/x/b` when both `/a/:x/b` and `/a/x/c` are defined.

### URL decoding

Segments are `decodeURIComponent`-ed automatically. `/user/john%20doe` → `{ id: "john doe" }`. Malformed sequences fall back to the raw string.

## API

### `<Router>`

| Prop | Type | Description |
|---|---|---|
| `routes` | `AppRoute[]` | Route definitions |
| `notFound` | `Component` | Component rendered on 404 (optional) |

### `<Link>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `to` | `string` | — | Target path |
| `replace` | `boolean` | `false` | Use `history.replaceState` instead of `pushState` |
| `activeClass` | `string` | `"active"` | Class added when `to` matches current path |

Any other props (`class`, `data-*`, `aria-*`, etc.) are forwarded to the `<a>` element.

### `lazy(load)`

Wraps a dynamic import for code-splitting:

```ts
const User = lazy(() => import("./pages/User.svelte"));
```

### `useRouter()`

Returns the router store from context. Must be called inside a `<Router>`.

```ts
import { useRouter } from "svelte-wayfind";

const router = useRouter();
router.push("/about");
router.back();
```

### Store methods

| Method | Description |
|---|---|
| `push(to)` | Navigate to a new entry |
| `replace(to)` | Replace the current entry |
| `back()` | `history.back()` |
| `forward()` | `history.forward()` |
| `navigate(to, { replace })` | `push` or `replace` based on options |

The store value is `{ path, hash, query }`.

## Validation (fail fast at boot)

The trie builder throws clear errors on impossible route combinations:

- **Duplicate routes** — `Duplicate route: "/about" is already defined.`
- **Conflicting params** — `:id` vs `:slug` at the same level → error
- **Children under wildcard** — routes under `/*` are unreachable → error
- **Empty param name** — `/user/:` → error

## How it works

```
Routes: /  /user/:id  /user/:id/settings  /blog/*

Trie:
root [endpoint: Home]
├── user
│   └── :id [endpoint: UserProfile]
│       └── settings [endpoint: Settings]
└── blog
    └── * [endpoint: Blog]
```

The trie is built **once** at component mount. On each navigation, `match()` descends from the root with backtracking, extracting parameters along the way. The last resolved path is cached.

## License

MIT
