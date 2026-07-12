import { Readable, writable } from "svelte/store";

export interface RouterState {
    path: string;
    hash: string;
    query: URLSearchParams;
}

export interface RouterStore extends Readable<RouterState> {
    push(to: string): void;
    replace(to: string): void;
    back(): void;
    forward(): void;
    navigate(to: string, options?: { replace?: boolean }): void
}

export function createRouterStore(): RouterStore {
    if (typeof window !== "undefined") {
        window.history.scrollRestoration = "manual"
        const initialState = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
        window.history.replaceState({ ...initialState, scroll: window.scrollY }, "")
    }

    const store = writable<RouterState>(readLocation())

    if (typeof window !== "undefined") {
        window.addEventListener("popstate", () => {
            store.set(readLocation())
            restoreScroll()
        })
    }

    function push(to: string): void {
        if (typeof window === "undefined") {
            store.set(parseLocation(to));
            return
        }

        replaceStateWithScroll()
        window.history.pushState({ scroll: 0 }, "", to)
        store.set(readLocation())
        window.scrollTo(0, 0)
    }

    function replace(to: string): void {
        if (typeof window === "undefined") {
            store.set(parseLocation(to))
            return
        }

        window.history.replaceState({ scroll: 0 }, "", to)
        store.set(readLocation())
    }

    function back(): void {
        if (typeof window !== "undefined") window.history.back()
    }

    function forward(): void {
        if (typeof window !== "undefined") window.history.forward()
    }

    function navigate(to: string, options?: { replace?: boolean }): void {
        if (options?.replace) replace(to)
    }

    return {
        subscribe: store.subscribe,
        push,
        replace,
        back,
        forward,
        navigate
    }
}

function parseLocation(to: string): RouterState {
    try {
        const url = new URL(to, "http://localhost")
        return { path: url.pathname, hash: url.hash, query: new URLSearchParams(url.search) }
    } catch {
        return { path: to, hash: "", query: new URLSearchParams() };
    }
}

function replaceStateWithScroll(): void {
    if (typeof window === "undefined") return;
    const current = window.history.state && typeof window.history.state === "object" ? window.history.state : {}
    window.history.replaceState({ ...current, scroll: window.scrollY }, "")
}

function restoreScroll(): void {
    if (typeof window === "undefined") return
    const state = window.history.state
    const scroll = state && typeof state.scroll === "number" ? state.scroll : 0
    window.scrollTo(0, scroll)
}

function readLocation(): RouterState {
    if (typeof window === "undefined") {
        return { path: "/", hash: "", query: new URLSearchParams() }
    }

    return {
        path: window.location.pathname,
        hash: window.location.hash,
        query: new URLSearchParams(window.location.search)
    }
}