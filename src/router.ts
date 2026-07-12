import { getContext } from "svelte";
import type { Route } from "./trie";
import type { RouterStore } from "./store";

export type Component = any;

export interface LazyWrapper {
    readonly __lazy: true;
    load: () => Promise<{ default: Component }>;
}

export type RouteHandler = Component | LazyWrapper;
export type AppRoute = Route<RouteHandler>;

export function lazy(load: () => Promise<{default: Component}>): LazyWrapper {
    return { __lazy: true, load };
}

export function isLazy(handler: unknown): handler is LazyWrapper {
    return typeof handler === "object" && handler !== null && (handler as LazyWrapper).__lazy === true
}

export const ROUTER_CONTEXT = Symbol("router");

export function useRouter(): RouterStore {
    const router = getContext<RouterStore>(ROUTER_CONTEXT);
    if (!router) {
        throw new Error("useRouter() muust be called within a <Router> component.")
    }
    return router
}