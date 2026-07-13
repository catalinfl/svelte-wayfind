<script lang="ts">
    import { untrack, setContext } from "svelte";
    import { buildTrie } from "../trie";
    import { createCachedMatcher } from "../cache";
    import { createRouterStore } from "../store";
    import { ROUTER_CONTEXT, isLazy, type AppRoute, type Component } from "../router";

    let { routes, notFound = null }: { routes: AppRoute[]; notFound?: Component } = $props();

    const root = untrack(() => buildTrie(routes));
    const matcher = createCachedMatcher(root);
    const router = createRouterStore();

    setContext(ROUTER_CONTEXT, router);

    let currentComponent = $state<Component>(null);
    let currentParams = $state<Record<string, string>>({});
    let ready = $state(false);
    let lastResolvedPath: string | null = null;
    let resolveToken = 0;

    async function resolve(path: string): Promise<void> {
        if (path === lastResolvedPath) return;
        const token = ++resolveToken;

        const result = matcher.match(path);
        if (result === null) {
            if (token !== resolveToken) return;
            currentComponent = notFound;
            currentParams = {};
            ready = true;
            lastResolvedPath = path;
            return;
        }

        const handler = result.node.handler;
        let component: Component;
        if (isLazy(handler)) {
            const mod = await handler.load();
            if (token !== resolveToken) return;
            component = mod.default;
        } else {
            component = handler;
        }

        if (token !== resolveToken) return;
        currentComponent = component;
        currentParams = result.params;
        ready = true;
        lastResolvedPath = path;
    }

    $effect(() => {
        const unsubscribe = router.subscribe(({ path }) => {
            ready = false;
            resolve(path);
        });
        return unsubscribe;
    });
</script>

{#if ready && currentComponent}
    {@const C = currentComponent}
    <C {...currentParams} />
{:else if ready && notFound}
    {@const NF = notFound}
    <NF />
{/if}
