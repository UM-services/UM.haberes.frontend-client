# Repository Instructions

## Workspace

- This is an Nx 22.7.1 monorepo using Angular 21, TypeScript 5.9, Vitest 4, and npm 11.6.2; use Node.js 20+.
- Install from the lockfile with `npm ci`; do not use another package manager.
- Applications live under `apps/`: `novedades` (port 4208) and `liquidacion` (port 4209).
- Shared libraries live under `libs/`: `shared-api`, `ui-auth`, `ui-layout`, `feature-designaciones`, `feature-anotador`, and `feature-cargos`.
- Use the configured `@haberes/*` path aliases for shared libraries and import public symbols through each library's `src/index.ts`. Nx ESLint enforces module boundaries using project tags (`type:*` and `scope:*`) and dependency direction rules.

## Commands

- Run one app with `npx nx serve <app>`; configured ports are novedades 4208 and liquidacion 4209 (matching docker-compose.yml).
- Run all local app servers with `npm run serve:all`.
- Build one project with `npx nx build <project>` or all projects with `npx nx run-many -t build`.
- Lint one project with `npx nx run <project>:lint` or all lint targets with `npx nx run-many -t lint`.
- Test one project with `npx nx test <project>` or all test targets with `npx nx run-many -t test --watch=false`.
- Routes use standalone `loadComponent` lazy loading for shared login and feature components; preserve this instead of reintroducing eager imports.

## Verification And Deployment

- TypeScript and Angular template checking are strict (`strict`, `strictTemplates`, strict injection parameters); preserve those checks rather than loosening compiler options.
- Production builds enforce initial bundle limits of 500 kB warning / 1 MB error and component-style limits of 4 kB warning / 8 kB error.
- All applications use `apps/<app>/Dockerfile`. Single-origin Nginx proxy with SSL on port 443 routes `/api/` to `haberes-gateway-service:8091`.
- Each app registers the shared `errorInterceptor` and `API_URL` provider.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
