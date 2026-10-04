# Repository Instructions

## Workspace

- This is an Nx 22.7.1 monorepo using Angular 21, TypeScript 5.9, Vitest 4, and npm 11.6.2; use Node.js 20+.
- Install from the lockfile with `npm ci`; do not use another package manager.
- Applications live under `apps/`: `novedades` (port 4208) and `liquidacion` (port 4209). Apps are thin shells: root component with `<ui-shell>`, `app.config.ts`, and `app.routes.ts` only; feature views never live inside `apps/<app>/src/app/`.
- Shared libraries live under `libs/`: `shared-api`, `ui-auth`, `ui-layout`, `feature-designaciones`, `feature-anotador`, `feature-cargos`, `feature-bonos`, and `feature-contabilidad`. Each feature library owns its screens and services and is consumed by the app whose scope tag it carries.
- `apps/novedades-e2e` is a Playwright project (chromium); its generated `e2e` target starts the novedades dev server on 4208. Set `BASE_URL` to test an already deployed app.
- Use the configured `@haberes/*` path aliases for shared libraries and import public symbols through each library's `src/index.ts`. Nx ESLint enforces module boundaries using project tags (`type:*` and `scope:*`) and dependency direction rules.

## Commands

- Run one app with `npx nx serve <app>`; configured ports are novedades 4208 and liquidacion 4209 (matching docker-compose.yml).
- Run all local app servers with `npm run serve:all`.
- Build one project with `npx nx build <project>` or all projects with `npx nx run-many -t build`.
- Lint one project with `npx nx run <project>:lint` or all lint targets with `npx nx run-many -t lint`.
- Test one project with `npx nx test <project>` or all test targets with `npx nx run-many -t test --watch=false`. Library unit tests use the `@angular/build:unit-test` executor wired to `novedades:build:development` (see each lib's `test` target and `tsconfig.spec.json`).
- Run E2E with `npx nx e2e novedades-e2e`; set `BASE_URL` to point at a deployed app instead of booting the dev server.
- Rebuild one app's image with `npm run docker:app -- <app>` (multistage `docker/app.Dockerfile`, compiles inside the image); `--no-up` only builds. Requires the compose stack or `docker build -f docker/app.Dockerfile --build-arg APP=<app> .` as fallback.
- Routes use standalone `loadComponent` lazy loading for shared login and feature components; preserve this instead of reintroducing eager imports.
- UI design follows the shared J2 theme: tokens and component utilities live in `libs/ui-layout/src/styles/tokens.css`, every app shell is `@haberes/ui-layout`'s `<ui-shell>`, and views use `um-*` classes (`.um-input`, `.um-btn-primary`, `.um-table`, ...) instead of ad-hoc palettes or one-off class strings.

## Verification And Deployment

- TypeScript and Angular template checking are strict (`strict`, `strictTemplates`, strict injection parameters); preserve those checks rather than loosening compiler options.
- Production builds enforce initial bundle limits of 500 kB warning / 1 MB error and component-style limits of 4 kB warning / 8 kB error.
- All applications build from the shared multistage `docker/app.Dockerfile` with `--build-arg APP=<app>`: the Node stage runs `npm ci` and `npx nx build <app> --configuration=production`, and the Nginx stage copies that build. Images depend only on source, never on a local `dist/apps/`, so do not reintroduce runtime-only Dockerfiles that `COPY dist/`. Per-app config (`nginx.conf`, `entrypoint.sh`) stays in `apps/<app>/`. Keep `node_modules`, `dist`, `.angular`, `.nx` and `.git` out of the build context in `.dockerignore`. Rebuilding through Compose requires `--build` (or `npm run docker:app -- <app>`) because `up -d` reuses an existing image without looking at the source.
- CI criteria (shared with um.tesoreria.frontend-client): PRs to `main` run affected lint/test/build via `ci.yml`; `develop`/`staging` PRs run full verify and pushes additionally publish images, while `main` pushes publish with `latest`. All environments flow through the reusable `.github/workflows/deploy-pipeline.yml`, which takes `apps` (JSON list) and never builds `dist/` in CI to copy into images (the multistage Dockerfile is the compile check on push). Image tags: full commit sha, plus `latest` only on main.
- Each app registers the shared `errorInterceptor` and `API_URL` provider. Haberes auth has no bearer token (legacy `isuservalid` session model against haberes-core): do not introduce an `auth.interceptor` unless the backend starts issuing tokens.

## UI & Enterprise Design System (Estándares Visuales Institucionales)

- **Aesthetic Philosophy**: Modern enterprise university portal ("anti-vibecoding"). Interfaces must convey institutional solidity, high data density, clear visual hierarchy, and sober elegance. Avoid decorative gimmicks, toy-like floating cards, excessive borders, or gratuitous heavy gradients.
- **Styling Architecture**: Tailwind CSS v4 (`@tailwindcss/postcss`). Keep custom CSS minimal in `styles.css` (custom scrollbars); the shared J2 theme `libs/ui-layout/src/styles/tokens.css` is the single source of corporate tokens. Component templates must use the semantic `um-*` classes (`.um-input`, `.um-btn-primary`, `.um-card`, `.um-table`, ...) first and utility classes with theme tokens for layout, instead of ad-hoc palettes or one-off class strings.
- **Color Palette & Semantic Roles**:
  - *Neutrals (um tokens)*: Page canvas `bg-um-canvas`, secondary surfaces `bg-um-surface`, cards `bg-white`, hairline borders `border-um-border` / `border-um-border-strong`, primary text `text-um-ink`, secondary `text-um-text`, muted micro-copy `text-um-muted`; dark shell sidebar `bg-um-sidebar` with `text-um-sidebar-text` / `text-um-sidebar-muted`.
  - *Brand & Primary Accent*: Universidad de Mendoza deep cobalt/royal blue via um tokens (`text-um-primary`, `bg-um-primary hover:bg-um-primary-hover`, selected states `bg-um-selected text-um-primary`, sidebar active `bg-um-sidebar-active text-white`).
  - *Semantics*: Emerald for positive balances/reconciled entries (`text-emerald-700 bg-emerald-50 border-emerald-200`), Amber for pending/auditing (`text-amber-700 bg-amber-50 border-amber-200`), Rose for errors/unbalanced entries (`text-rose-700 bg-rose-50 border-rose-200`).
- **Typography & Numerical Data**:
  - Global font: **Inter** (`var(--font-um)`), subpixel rendering (`antialiased text-um-ink`).
  - Numeric & currency alignment: Always use tabular numbers (`tabular-nums`) and monospace font (`font-mono`) for monetary amounts, legajo numbers, accounting codes, and balance totals. Right-align all numerical and financial columns in data tables.
  - Micro-labels and section headers: Crisp, compact metadata using `text-[10px]` or `text-[11px]`, `font-bold` or `font-semibold`, uppercase, with `tracking-wider`.
- **Data Tables & Density**:
  - Design for enterprise workflows: use the semantic `.um-table` (compact `text-sm`, uppercase micro-headers in `text-um-muted`, hairline `border-um-border` row dividers); for bespoke tables keep sticky `thead`, compact cell padding (`py-2 px-3`) and subtle hover feedback.
- **Form Controls & Inputs**:
  - Use `.um-input` (`.um-input-invalid` for error state), `.um-label`, `.um-btn-primary` and `.um-btn-secondary` instead of per-field class strings; compact height and subdued focus rings come from the theme.

## Standard Person Search (Buscador de Personas Estándar)

- Every screen that looks up a person MUST use the standard search: the `<ui-persona-search>` component from `@haberes/ui-layout`, backed by `PersonaSearchService` from `@haberes/shared-api`. Do NOT re-implement search pipelines (Subject/debounce/dropdown wiring) inside feature libs, and do NOT add persona-search methods to feature services.
- `PersonaSearchService` is the only client for haberes-core's `/api/haberes/core/persona` endpoints; the backend already implements the query semantics, so it must not be modified for UI search needs:
  - `searchPersonas(termino)` / `buscar(termino)`: `POST /search` with the term split by spaces into an array of words (each one is an AND `LIKE '%word%'` condition over `vw_persona_search.search`, ordered by apellido/nombre, top 50 server-side). `buscar` searches from the first character (no minimum length) and only falls back to the exact legajo when the term is numeric and the text search found nothing.
  - `getPersonaByLegajo(legajoId)` → `GET /persona/{legajoId}`; `getPersonaByDocumento(documento)` → `GET /persona/documento/{documento}`.
- `<ui-persona-search>` behavior (mirrors the legacy typeahead modal: multi-word list, keyboard selection):
  - Results render as `Apellido, Nombre (legajo)`; ArrowDown/ArrowUp move the highlight, ENTER confirms, ESC closes the panel.
  - On selection it re-fetches the complete persona by legajo before emitting `(seleccionada)`; when the user edits the text after a selection it emits `null` once and keeps the typed text intact (parent echoes through `[persona]` are ignored).
  - Inputs: `label`, `placeholder`, `buscandoLabel`, `panelClases` (panels inside `overflow-hidden` cards pass `panelClases="z-50 max-h-40"`), `[persona]` for parent-side preselections, and the `limpiar()` method to reset the field without emitting.
- Exact-key lookups (legajo/DNI) belong in their own editable form fields firing on ENTER and blur via `getPersonaByLegajo` / `getPersonaByDocumento` (see `bono-individual`), not in the search box. Never re-add a numeric branch inside a feature's own search call.
- The shared type is `Persona` (`@haberes/shared-api`, defined in `auth.service.ts`, with `documento`, `estado` and `dependenciaId`); do not define per-feature duplicate persona interfaces.
- Exception: `feature-contabilidad` belongs to another backend and keeps its own service; do not migrate it to the standard search or "unify" its endpoints.

## Brand Display Standards (Marca Institucional)

- **Text Brand Mark, No Logos**: The `<ui-shell>` brand is always text — there is no `logoUrl` input and no institutional logo image anywhere in the shell or login (mirrors the tesoreria-frontend shell).
- **Desktop Sidebar**: `UM · Haberes` (`text-lg font-bold leading-6`) stacked over the module name (`text-sm text-um-sidebar-muted`), inside the `border-b border-white/20 px-3 pb-6` block.
- **Mobile Header**: brand text `UM · Haberes` plus the environment badge; no logo and no module name, same as tesorería.
- **Login**: text-only header (`um-eyebrow` "Haberes" + `um-page-title` "UM Haberes"); do not reintroduce a `logo.png` image.

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
