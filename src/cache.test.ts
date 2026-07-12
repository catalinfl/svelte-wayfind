import { describe, it, expect } from "vitest";
import { buildTrie, type Route } from "./trie";
import { createCachedMatcher } from "./cache";

describe("createCachedMatcher", () => {
    const routes: Route<string>[] = [
        { path: "/", handler: "Home" },
        { path: "/user/:id", handler: "UserProfile" },
    ];

    it("returns the correct result on first call", () => {
        const root = buildTrie(routes);
        const matcher = createCachedMatcher(root);
        const result = matcher.match("/user/42");
        expect(result?.node.handler).toBe("UserProfile");
        expect(result?.params).toEqual({ id: "42" });
    });

    it("returns the same reference on cache hit", () => {
        const root = buildTrie(routes);
        const matcher = createCachedMatcher(root);
        const first = matcher.match("/user/42");
        const second = matcher.match("/user/42");
        expect(second).toBe(first);
    });

    it("recomputes when path changes", () => {
        const root = buildTrie(routes);
        const matcher = createCachedMatcher(root);
        const a = matcher.match("/user/42");
        const b = matcher.match("/user/7");
        expect(a?.params).toEqual({ id: "42" });
        expect(b?.params).toEqual({ id: "7" });
        expect(b).not.toBe(a);
    });

    it("caches null (404) results too", () => {
        const root = buildTrie(routes);
        const matcher = createCachedMatcher(root);
        expect(matcher.match("/nope")).toBeNull();
        expect(matcher.match("/nope")).toBeNull();
    });

    it("clear() drops the cached entry", () => {
        const root = buildTrie(routes);
        const matcher = createCachedMatcher(root);
        matcher.match("/user/42");
        matcher.clear();
        expect(matcher.match("/user/42")?.params).toEqual({ id: "42" });
    });
});