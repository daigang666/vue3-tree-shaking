# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 SFC (Single File Component) tree-shaking utility library. It parses Vue SFCs, analyzes which variables are actually used in the template, and removes unused imports/variables/functions from the `<script setup>` block.

Published to npm as `vue3-tree-shaking`.

## Commands

- `npm run dev` — Start Vite dev server (demo UI for testing tree-shaking)
- `npm run build` — Build library (Vite library mode + tsc declarations)

No test framework or linter is configured.

## Build Output

Library mode via Vite. Entry: `./lib/index.ts`. Outputs:
- `dist/index.js` (ESM)
- `dist/index.umd.cjs` (UMD)
- `dist/index.d.ts` (types)

## Architecture

The library exports a single function `treeShakeVueSFC(code)` from `lib/index.ts`.

### Processing Pipeline

1. **Parse SFC** — `@vue/compiler-sfc` parses the `.vue` file into a descriptor
2. **Collect template variables** (`lib/variable_collector.ts`) — Traverses the template AST via `@vue/compiler-core` transforms, extracting all referenced identifiers from directives, interpolations, and expressions. Uses `acorn` to parse complex JS expressions within templates.
3. **Remove unused code** (`lib/babelPluginShakeVueScript.js`) — A Babel visitor plugin that walks the `<script setup>` AST and removes declarations/imports not found in the template variable set. Handles: imports, variable declarations, function declarations, destructured properties, and cleans up empty statements.
4. **Reconstruct SFC** — Reassembles the component with the cleaned script block.

### Key Design Details

- `variable_collector.ts` filters out template-local scope variables (e.g., `v-for` loop variables) to avoid false positives
- The Babel plugin (`babelPluginShakeVueScript.js`) is plain JS (not TypeScript) and receives `usedVars` via plugin options
- `@babel/standalone` is used for browser-compatible Babel transforms (the demo runs in-browser)

## Demo App

`src/` contains a browser demo with file upload UI. `src/test/vue_sfc.vue` is a realistic test fixture with complex template patterns (v-if, v-for, v-bind, interpolations, many imports).

## CI/CD

GitHub Actions publishes to npm on release creation (Node 20, `.github/workflows/npm-publish.yml`).
