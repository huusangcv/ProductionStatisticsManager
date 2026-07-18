---
name: electron-rules
description: Use to follow Electron best practices (preload bridge, IPC-only, etc.)
---

# Electron Rules

Never use Browser APIs unsupported by Electron.

Always use preload bridge.

Never access filesystem directly inside React.

IPC only.

Keep renderer clean.

Business logic belongs to Electron Main Process.