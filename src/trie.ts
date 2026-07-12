export interface TrieNode<T = unknown> {
    readonly staticChildren: Map<string, TrieNode<T>>; // children of current node, but static
    paramChild: TrieNode<T> | null; // bottom child has an param node, paramChild node contains inside paramName
    wildcardChild: TrieNode<T> | null; // bottom child has an wildcard node, same for wildcard
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
        insertRoute(root, segments, route.path, route.handler)
    }
    
    return root
}

function insertRoute<T>(
    root: TrieNode<T>,
    segments: string[],
    path: string, // error log
    handler: T
) {
    if (segments.length === 0) {
        if (root.isEndpoint) {
            throw new Error(`Duplicate route: "${path}" is already defined.`)
        }
        root.isEndpoint = true
        root.handler = handler
        return
    }

    let node = root

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const isLast = i === segments.length - 1

        node = descendOrCreate(node, segment, path)

        if (isLast) {
            if (node.isEndpoint) {
                throw new Error(`Duplicate route "${path}" is already defined.`)
            }
            node.isEndpoint = true
            node.handler = handler
        }
    }
}


function descendOrCreate<T>(
    node: TrieNode<T>,
    segment: string,
    path: string,
): TrieNode<T> { // returns next node or static child
    if (node.wildcardName !== null) {
        throw new Error(`Cannot define "${path}: wildcard "*" captures the rest of the path, so routes under it are unreachable`)
    }

    if (segment.startsWith(':')) {
        const name = segment.slice(1)

        if (name.length === 0) {
            throw new Error(`Invalid route "${path}": parameter name is empty (segment ":").`)
        }

        if (node.paramChild === null) {
            node.paramChild = createNode<T>(name)
        } else if (node.paramChild.paramName !== name) {
            throw new Error(`Conflicting parameters in route "${path}": ":${name}" conflicts with existing ":${node.paramChild.paramName}" at the same level. Only one parameter name is allowed per level.`)
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
