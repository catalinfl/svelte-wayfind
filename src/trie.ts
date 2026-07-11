interface TrieNode<T = unknown> {
    readonly staticChildren: Map<string, TrieNode<T>>; // all children of root
    paramChild: TrieNode<T> | null; // bottom child has an param node
    wildcardChild: TrieNode<T> | null; // bottom child has an wildcard node
    readonly paramName: string | null; // paramName = "id" when node equals to [:id] (example: /test/:id)
    readonly wildcardName: string | null; // wildcardName = * when node equals to * (example: /test/*)
    isEndpoint: boolean; 
    handler: T | null;
}

interface Route<T = unknown> {
    path: string;
    handler: T;
}


function buildTrie<T = unknown>(routes: Route<T>[]): TrieNode<T> {
    const root = createNode<T>()

    for (const route of routes) {
        const segments = splitPath(route.path)
        insertRoute(root, segments, route.handler)
    }
    
    return root
}

function insertRoute<T>(
    root: TrieNode<T>,
    segments: string[],
    handler: T
) {
    if (segments.length === 0) {
        root.isEndpoint = true
        root.handler = handler
        return
    }

    let node = root

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const isLast = i === segments.length - 1

        node = descendOrCreate(node, segment)

        if (isLast) {
            node.isEndpoint = true
            node.handler = handler
        }
    }
}


function descendOrCreate<T>(
    node: TrieNode<T>,
    segment: string
): TrieNode<T> {
    if (segment.startsWith(':')) {
        const name = segment.slice(1)
        if (node.paramChild === null) {
            node.paramChild = createNode<T>(name)
        }
        return node.paramChild
    }

    if (segment === "*") {
        if (node.wildcardChild === null) {
            node.wildcardChild = createNode<T>(null, '*')
        }
        return node.wildcardChild
    }


    const existing = node.staticChildren.get(segment)

    if (existing !== undefined) {
        return existing
    }

    const child = createNode<T>();
    node.staticChildren.set(segment, child)
    return child;
}

// "/path/to/file" => ["", "path", "to", "file"] => filter
function splitPath(path: string): string[] {
    return path.split('/').filter(segment => segment.length > 0)
}

function createNode<T = unknown>(
    paramName: string | null = null,
    wildcardName: string | null = null
): TrieNode<T> {
    return {
        staticChildren: new Map(),
        paramChild: null,
        wildcardChild: null,
        paramName,
        wildcardName,
        isEndpoint: false,
        handler: null
    }
}
