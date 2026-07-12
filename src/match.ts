// we search - a/x/b between a/x/c and a/:id/b
// with greedy router is blocked because enters a/x, but won't find b
// with backtracking we enter a/x/b, where paramName for :id is x

import { splitPath, type TrieNode } from "./trie"

export interface MatchResult<T = unknown> {
    node: TrieNode<T>;
    params: Record<string, string>
}

export function match<T = unknown>(
    node: TrieNode<T>,
    segments: string[],
    index: number = 0,
    params: Record<string, string> = {},
): MatchResult<T> | null {
    if (index === segments.length) {
        return node.isEndpoint ? { node, params } : null
    }

    const segment = segments[index]
    const staticChild = node.staticChildren.get(segment)

    if (staticChild !== undefined) {
        const result = match(staticChild, segments, index + 1, params)
        if (result !== null) {
            return result
        }
    }

    if (node.paramChild !== null) {
        const newParams = { ...params, [node.paramChild.paramName!]: segment}
        const result = match(node.paramChild, segments, index + 1, newParams)
        if (result !== null) {
            return result
        }
    }

    if (node.wildcardChild !== null) {
        return {
            node: node.wildcardChild,
            params: { ...params, [node.wildcardChild.wildcardName!]: segments.slice(index).join("/")}
        }
    }

    return null
}

// when store path is changing, matchPath is called
export function matchPath<T = unknown>(
    root: TrieNode<T>,
    path: string
): MatchResult<T> | null {
    const segments = splitPath(path).map(decodeSegment);
    return match(root, segments, 0, {})
}

function decodeSegment(segment: string): string {
    try {
        return decodeURIComponent(segment)
    }
    catch {
        return segment
    }
}