import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
    plugins: [
        svelte(),
        dts({
            include: ["src/**/*.ts", "src/**/*.svelte"],
            exclude: ["src/**/*.test.ts"],
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "SvelteWayfind",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: ["svelte", "svelte/*", /^svelte\//],
            output: {
                globals: {
                    svelte: "svelte",
                },
            },
        },
    },
});
