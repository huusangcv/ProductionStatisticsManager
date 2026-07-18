---
name: project-context
description: Use to understand the project's purpose, users, goals, UI principles, and development philosophy
---

# Project Context

## Project Overview

Production Statistics Manager is an internal desktop ERP/MES application developed for factory production statistics.

The application is designed to replace manual Excel workflows and reduce repetitive data entry.

The software is used daily by production statistics staff to manage production data, employee information, reports, overtime records, and Excel imports/exports.

---

## Target Users

Primary users:

- Production Statistics Staff
- Production Supervisors
- HR Staff

Users are not software engineers.

The interface must be simple, predictable, and optimized for repetitive daily tasks.

---

## Business Goals

The application focuses on:

- Fast production data entry
- Accurate statistics
- Employee management
- Excel template import/export
- Historical production reports

The application is NOT a public-facing product.

Reliability is more important than visual effects.

---

## Product Philosophy

Always prioritize:

1. Productivity over aesthetics.
2. Consistency over creativity.
3. Speed over animations.
4. Clarity over complexity.

Every screen should require as few clicks as possible.

---

## UI Principles

Desktop First.

Optimized for:

- 1920×1080
- 2560×1440

Large tables are expected.

Scrolling inside DataGrid is preferred over long pages.

Avoid unnecessary animations.

Avoid decorative UI elements.

Keep important actions visible.

---

## Data Characteristics

The application handles:

- Thousands of employees
- Large Excel files
- Large production datasets
- Daily statistics
- Historical reports

Performance should always be considered.

---

## Offline Strategy

The application primarily works offline.

SQLite is the primary database.

Internet connection should never be required for core features.

---

## Development Philosophy

Before creating anything new:

1. Search existing components.
2. Reuse existing code.
3. Extend existing functionality.
4. Keep architecture consistent.

Never redesign an existing workflow unless explicitly requested.

---

## AI Design Principles

When generating code:

- Match the current design language.
- Respect the existing folder structure.
- Follow Material UI standards.
- Keep generated code minimal.
- Prefer composition over duplication.
- Never introduce new UI libraries.