import type { Component } from "svelte";
import type { Route, Component as RouteComponent } from "../router";

interface RouterProps {
    routes: Route[];
    notFound?: RouteComponent;
}

declare const Router: Component<RouterProps>;
export default Router;
