export { buildTrie, splitPath, type Route, type TrieNode } from "./trie";
export { match, matchPath, type MatchResult } from "./match";
export { createCachedMatcher, type CachedMatcher } from "./cache";
export { createRouterStore, type RouterStore, type RouterState } from "./store";
export {
    lazy,
    isLazy,
    useRouter,
    ROUTER_CONTEXT,
    type AppRoute,
    type RouteHandler,
    type LazyWrapper,
    type Component,
} from "./router";
export { default as Router } from "./components/Router.svelte";
export { default as Link } from "./components/Link.svelte";