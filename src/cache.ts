import { matchPath, type MatchResult } from "./match"
import type { TrieNode } from "./trie"

export interface CachedMatcher<T = unknown> {
    match(path: string): MatchResult<T> | null
    clear(): void
}

export function createCachedMatcher<T = unknown>(root: TrieNode<T>): CachedMatcher<T> {
    let lastPath: string | null = null
    let lastResult: MatchResult<T> | null = null;

    return {
        match(path: string): MatchResult<T> | null {
            if (path === lastPath) {
                return lastResult
            }

            lastPath = path
            lastResult = matchPath<T>(root, path)
            return lastResult
        },

        clear(): void {
            lastPath = null
            lastResult = null
        }
    }
}