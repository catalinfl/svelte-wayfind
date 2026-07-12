<script lang="ts">
    import { getContext } from "svelte";
    import { readable, type Readable } from "svelte/store";
    import { ROUTER_CONTEXT } from "./router";
    import { RouterStore, RouterState } from "./store";

    let {
        to,
        replace = false,
        activeClass = "active",
        class: className = "",
        children,
        ...restProps
    } = $props();

    const fallback = readable<RouterState>({ path: "", hash: "", query: new URLSearchParams() });
    const ctxRouter = getContext<RouterStore>(ROUTER_CONTEXT);
    const router: Readable<RouterState> = ctxRouter ?? fallback;

    function handleClick(event: MouseEvent): void {
        if (!ctxRouter) return;
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = event.currentTarget as HTMLAnchorElement;
        if (anchor.target === "_blank" || anchor.target === "_parent" || anchor.target === "_top") return;

        event.preventDefault();
        if (replace) ctxRouter.replace(to);
        else ctxRouter.push(to);
    }

    let isActive = $derived($router.path === to);
    let classes = $derived([className, isActive ? activeClass : null].filter(Boolean).join(" "));
</script>

<a {...restProps} href={to} onclick={handleClick} class={classes}>
    {@render children?.()}
</a>
