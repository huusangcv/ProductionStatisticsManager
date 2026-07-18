---
name: project-agents
description: Use to follow the project's required workflow, reuse rules, architecture, and design guidelines
---

# Production Statistics Manager

Production Statistics Manager is an internal Enterprise Desktop ERP/MES application.

Tech Stack

- Electron
- React
- Material UI
- SQLite
- better-sqlite3
- ExcelJS

The project is desktop-first and optimized for factory production statistics.

---

# Required Workflow

Before writing any code:

1. Use GitNexus to explore the project.
2. Load every available Skill.
3. Read project-context.md.
4. Read architecture.md.
5. Search existing implementation.
6. Reuse existing components.
7. Run impact analysis.
8. Generate the smallest safe change.

Never skip project analysis.

---

# Reuse First

Always search for existing:

- Page
- Component
- Hook
- Context
- Service
- Utility
- IPC Handler
- SQLite Repository
- Dialog
- Toolbar
- DataGrid

Never duplicate business logic.

Always extend.

---

## Feature Implementation Rule

Before implementing any feature:

1. Search for an existing implementation of the same feature.
2. Search for similar pages.
3. Search reusable components.
4. Search reusable dialogs.
5. Search reusable hooks.
6. Search reusable services.
7. Search reusable IPC handlers.
8. Search reusable SQLite repositories.
9. Search reusable Excel helpers.

Only create new files when no suitable implementation exists.

If an existing implementation can be extended, always extend it instead of creating a new one.

Never create duplicate business logic.

---

# Architecture

Never

- duplicate components
- duplicate IPC handlers
- duplicate SQL
- duplicate dialogs
- duplicate utilities

Always reuse.

Keep current folder structure.

Never create a second implementation.

---

# Desktop Rules

Desktop only.

Target resolution

- 1920x1080
- 2560x1440

No responsive mobile layouts.

Large DataGrid is expected.

Dialogs are preferred over navigation.

---

# Electron Rules

Always reuse:

- preload API
- IPC handlers
- ipcMain.handle
- ipcRenderer.invoke

Never use window.require.

Never bypass preload.

Never expose Node APIs directly.

---

# SQLite Rules

All database access goes through Repository layer.

Never execute SQL inside React components.

Never duplicate queries.

Always use transactions for batch operations.

---

# Excel Rules

Excel template is the source of truth.

Never recreate formatting manually.

Always preserve

- merged cells
- row height
- column width
- borders
- formulas
- number format
- alignment
- validation
- filter

Never hardcode column index.

Always map by header name.

---

# UI Rules

Always use

Material UI

Always use

DataGrid

Toolbar above DataGrid.

PageHeader.

Card.

Dialog.

Snackbar.

Loading overlay.

No custom UI library.

---

# Performance

Large dataset expected.

Prefer

memo

useMemo

useCallback

virtualization

batch updates

Avoid unnecessary rerenders.

---

# Coding Style

Prefer composition.

Small functions.

Small components.

Single responsibility.

No giant files.

---

# Before Completing

Check

✓ No duplicated logic

✓ Existing component reused

✓ IPC reused

✓ SQLite reused

✓ Theme respected

✓ Enterprise UI respected

✓ No regression

✓ Minimal diff