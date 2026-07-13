import type { Component, Snippet } from "svelte";

interface LinkProps {
    to: string;
    replace?: boolean;
    activeClass?: string;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
}

declare const Link: Component<LinkProps>;
export default Link;
