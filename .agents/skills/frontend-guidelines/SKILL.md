---
name: frontend-guidelines
description: "UI/UX design system and frontend guidelines for UM Haberes. USE WHEN creating or modifying Angular components, editing templates, writing Tailwind CSS classes, displaying logos, styling data tables or forms, or ensuring consistent enterprise aesthetics and preventing legacy VB6 mentions in the UI."
---

# UM Haberes Frontend & Design System Guidelines

This skill provides the authoritative UI/UX design specifications, component patterns, and styling standards for the **UM Haberes** frontend ecosystem (Angular 21 + Tailwind CSS v4 + Nx).

---

## 1. Core Visual Philosophy: Enterprise Institutional

The UM Haberes suite manages university payroll, novelties, accounting, and teacher designations. The design must project **institutional stability, sober elegance, clarity, and high information density**.

### Anti-"Vibecoding" Principles
- **No gimmicks**: Avoid floating toy-like cards, rainbow gradients, heavy drop shadows, or arbitrarily large border-radii (`rounded-3xl` / `rounded-full` on cards).
- **High data density with breathing room**: Operators handle dense tables with hundreds of records. Spacing must be compact (`py-2 px-3` in table cells, `py-1.5 px-3` in form controls) without feeling cramped.
- **Visual hierarchy**: Anchor pages with subtle slate borders, clean headers, muted micro-labels, and crisp status badges.

---

## 2. Color Palette & Semantic Tokens

| Category | Tailwind Classes | Purpose / Context |
|---|---|---|
| **Canvas & Backdrop** | `bg-slate-50` | Main application background |
| **Surfaces & Cards** | `bg-white border border-slate-200/80 shadow-xs` | Content cards, data tables, panels |
| **Dividers & Borders** | `border-slate-200/80`, `divide-slate-100` | Subtle hairline separation |
| **Primary Text** | `text-slate-900` | Section headings, primary labels, table data |
| **Secondary Text** | `text-slate-600` | Supporting text, descriptions, table body secondary cells |
| **Micro-labels** | `text-slate-400 font-semibold tracking-wider uppercase` | Metadata tags, table headers (`text-[10px]` or `text-[11px]`) |
| **Brand Primary (UM Blue)** | `text-blue-700`, `bg-blue-600 hover:bg-blue-700` | Primary buttons, active sidebar items, focus indicators |
| **Active Surface** | `bg-blue-50/90 text-blue-800 ring-1 ring-blue-600/10` | Active route in sidebar, selected row in table |
| **Success / Credited** | `text-emerald-700 bg-emerald-50 border-emerald-200` | Positive balances, reconciled accounts, active status |
| **Warning / Auditing** | `text-amber-700 bg-amber-50 border-amber-200` | Pending approvals, revisions required, intermediate states |
| **Danger / Unbalanced** | `text-rose-700 bg-rose-50 border-rose-200` | Errors, negative/unbalanced journal lines, failed syncs |

---

## 3. Typography & Numerical Data Rules

- **Font Family**: Inter (`font-sans`), sub-pixel antialiased (`antialiased text-slate-800`).
- **Financial & Monetary Figures**:
  - **Always** use tabular numbers: `tabular-nums`.
  - Prefer monospace accents for accounting values and legajos: `font-mono text-xs font-semibold`.
  - **Always right-align** currency and numeric columns: `text-right tabular-nums`.
- **Micro-labels**:
  - Use `text-[10px]` or `text-[11px] font-bold text-slate-400 uppercase tracking-wider` for section titles, card headers, and table column titles.

---

## 4. Logo & Brand Asset Specifications

- **Asset**: `apps/liquidacion/public/logo.png`
- **Aspect Ratio**: 204 × 102 px (2:1 landscape rectangle; UM shield + 65th-anniversary legend).
- **CRITICAL RULE**: **NEVER** wrap the logo in a rigid square container (`w-9 h-9`, `w-10 h-10`, `rounded-full`). Doing so squashes the logo height to ~14 px, destroying legibility.
- **Approved Sizing**:
  - **Sidebar (Desktop)**: `h-11 w-auto object-contain rounded-md shadow-2xs` (44 px height × ~88 px width).
  - **Login / Auth Card**: `h-20 sm:h-24 w-auto object-contain` (80–96 px height).
  - **Mobile Header**: `h-8 w-auto object-contain` (32 px height).

---

## 5. Strict Prohibition of Legacy VB6 in UI

- **NO Visual Basic 6 artifacts in user-facing templates**:
  - Do NOT display `.frm`, `.vbp`, `.bas`, or `.cls` extensions in page titles, cards, badges, or directory rows.
  - Do NOT use phrases like *"migrado desde Visual Basic 6"*, *"formulario VB6"*, or *"prjBonos.vbp"*.
- **Use Modern Domain Terminology**:
  - `frmAsientoInd.frm` → `Módulo Contable • Asiento Individual`
  - `frmLiqGeneral.frm` → `Liquidación General de Haberes`
  - `Pendiente de migración` → `Planificado en Desarrollo`
  - `Referencia VB6` → `Área Operativa` / `Catálogo Unificado`
- **Internal Compatibility**: Route data and data models may retain `origenVb6: string` for internal mapping or search indexing, but it must **never** be rendered in HTML templates.

---

## 6. Approved Component Templates

### Page Header with Subtitle and Actions
```html
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 mb-6">
  <div>
    <div class="flex items-center gap-2">
      <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
        Módulo Operativo
      </span>
      <span class="text-xs text-slate-600 font-mono">ID: 1042</span>
    </div>
    <h1 class="text-xl font-bold text-slate-900 tracking-tight mt-1">Título del Módulo</h1>
    <p class="text-xs text-slate-500 mt-0.5">Descripción clara y concisa de la operación en curso.</p>
  </div>
  <div class="flex items-center gap-2">
    <button type="button" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs">
      Exportar
    </button>
    <button type="button" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs">
      Guardar Cambios
    </button>
  </div>
</div>
```

### Enterprise Data Table
```html
<div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <th class="py-2.5 px-3">Código</th>
          <th class="py-2.5 px-3">Concepto / Denominación</th>
          <th class="py-2.5 px-3 text-right">Monto Debe</th>
          <th class="py-2.5 px-3 text-right">Monto Haber</th>
          <th class="py-2.5 px-3 text-center">Estado</th>
          <th class="py-2.5 px-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-xs">
        <tr class="hover:bg-slate-50/70 transition-colors">
          <td class="py-2.5 px-3 font-mono font-semibold text-slate-800">101002</td>
          <td class="py-2.5 px-3 text-slate-700">Sueldos Básicos Docentes</td>
          <td class="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">$ 450.000,00</td>
          <td class="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">-</td>
          <td class="py-2.5 px-3 text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Imputado
            </span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <button class="text-blue-700 hover:text-blue-900 font-medium text-xs">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Search and Filter Bar
```html
<div class="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs mb-4 flex flex-col sm:flex-row items-center gap-3">
  <div class="relative flex-1 w-full">
    <input
      type="text"
      placeholder="Buscar por legajo, apellido o código..."
      class="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
    />
  </div>
  <select class="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
    <option value="">Todos los Grupos</option>
    <option value="activos">Solo Activos</option>
  </select>
</div>
```
