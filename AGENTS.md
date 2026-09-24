# Repository Instructions

## Workspace

- This is an Nx 22.7.1 monorepo using Angular 21, TypeScript 5.9, Vitest 4, and npm 11.6.2; use Node.js 20+.
- Install from the lockfile with `npm ci`; do not use another package manager.
- Applications live under `apps/`: `novedades` (port 4208) and `liquidacion` (port 4209).
- Shared libraries live under `libs/`: `shared-api`, `ui-auth`, `ui-layout`, `feature-designaciones`, `feature-anotador`, `feature-cargos`, `feature-bonos`, and `feature-contabilidad`.
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

## UI & Enterprise Design System (Estándares Visuales Institucionales)

- **Aesthetic Philosophy**: Modern enterprise university portal ("anti-vibecoding"). Interfaces must convey institutional solidity, high data density, clear visual hierarchy, and sober elegance. Avoid decorative gimmicks, toy-like floating cards, excessive borders, or gratuitous heavy gradients.
- **Styling Architecture**: Tailwind CSS v4 (`@tailwindcss/postcss`). Keep custom CSS minimal in `styles.css` (custom scrollbars, Inter font import); all component templates must use utility classes with consistent tokens.
- **Color Palette & Semantic Roles**:
  - *Neutrals (Slate-first)*: Page canvas `bg-slate-50`, cards/surfaces `bg-white`, hairline borders `border-slate-200/80` or `border-slate-100`, primary text `text-slate-900`, secondary `text-slate-600`, muted micro-copy `text-slate-400`/`text-slate-500`.
  - *Brand & Primary Accent*: Universidad de Mendoza deep cobalt/royal blue (`text-blue-700`, `bg-blue-600 hover:bg-blue-700`, active states `bg-blue-50/90 text-blue-800 ring-1 ring-blue-600/10`).
  - *Semantics*: Emerald for positive balances/reconciled entries (`text-emerald-700 bg-emerald-50 border-emerald-200`), Amber for pending/auditing (`text-amber-700 bg-amber-50 border-amber-200`), Rose for errors/unbalanced entries (`text-rose-700 bg-rose-50 border-rose-200`).
- **Typography & Numerical Data**:
  - Global font: **Inter** (`font-sans`), subpixel rendering (`antialiased text-slate-800`).
  - Numeric & currency alignment: Always use tabular numbers (`tabular-nums`) and monospace font (`font-mono`) for monetary amounts, legajo numbers, accounting codes, and balance totals. Right-align all numerical and financial columns in data tables.
  - Micro-labels and section headers: Crisp, compact metadata using `text-[10px]` or `text-[11px]`, `font-bold` or `font-semibold`, uppercase, with `tracking-wider`.
- **Data Tables & Density**:
  - Design for enterprise workflows: sticky `thead` with `bg-slate-50/90 backdrop-blur-xs`, compact cell padding (`py-2 px-3`), hairline row dividers (`border-b border-slate-150` or `divide-y divide-slate-100`), and subtle hover feedback (`hover:bg-slate-50/80`).
- **Form Controls & Inputs**:
  - Compact height (`py-1.5 px-3 text-xs`), subtle borders (`border-slate-200`), and subdued focus rings (`focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`).

## Brand & Logo Display Standards (Logotipo Institucional)

- **Asset**: `apps/liquidacion/public/logo.png` (Dimensions: 204 × 102 px, 2:1 landscape rectangular ratio; navy blue badge with UM shield and 65th-anniversary lettering).
- **Proportions Rule**: NEVER wrap `logo.png` in a rigid square container (e.g., `w-9 h-9`, `w-10 h-10`). Because the image is twice as wide as it is tall, square constraints collapse the logo's effective height to ~14 px, rendering the emblem and text unreadable.
- **Sizing Specifications**:
  - *Desktop Sidebar*: `h-11 w-auto` (44 px height × ~88 px width), paired with a vertical hairline divider (`h-7 w-px bg-slate-200`) and the subsystem subtitle.
  - *Login Screen*: `h-20 sm:h-24 w-auto` (80–96 px height), with soft elevation and ring border.
  - *Mobile Header/Navbar*: `h-8 w-auto` (32 px height).

## Nomenclature & Legacy VB6 Strict Ban (Nomenclatura y Limpieza de UI)

- **Strict UI Ban**: NEVER expose Visual Basic 6 legacy artifacts in user-facing UI. This includes:
  - No `.frm` or `.vbp` file extensions in titles, cards, directory tables, or badges.
  - No phrases mentioning "migración desde VB6", "formulario VB6", or legacy project names (`prjBonos.vbp`).
- **Modern Institutional Copy**:
  - Use clean domain terminology: "Módulo Contable", "Asiento Individual", "Operaciones de Liquidación", "Catálogo Unificado", "Módulo en Desarrollo".
  - Status indicators must use product terminology: e.g. "Planificado en Desarrollo" instead of "Pendiente de migración".
- **Internal Backward Compatibility**: Internal routing or model fields named `origenVb6` may be retained in TypeScript data structures/routing definitions for backend protocol mapping or search fallback, but they MUST NEVER be rendered into HTML templates or exposed to users.


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
