# AURIS Master Monorepo

Welcome to the master control repository for **Auris**. 

This monorepo aggregates all core services, edge drivers, frontends, and configuration templates into a single, beautifully organized source of truth under OneDrive.

---

## 📂 Folder Layout

| Folder | Designated GitHub Repository | Description |
|:---|:---|:---|
| **[`server/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server)** | [`auris-server`](https://github.com/sakshamshh/auris-server) | FastAPI Cloud backend, ORB features Structure-from-Motion (SfM), homography projection algorithms, and database models. |
| **[`edge/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/edge)** | [`DOWNLOAD-AURIS-`](https://github.com/sakshamshh/DOWNLOAD-AURIS-) | Production client build for Intel N100 local installations. Contains `edge_worker.py` and `install_edge.sh` auto-installer. |
| **[`dashboard/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard)** | Part of [`MY-AURIS`](https://github.com/sakshamshh/MY-AURIS) | Admin Vite-React portal and React Native Expo mobile screens. |

---

## 🚀 Unified Deployment Sync

You can instantly initialize, commit, and push changes from your local subdirectories to their respective individual GitHub repositories by executing our built-in sync manager:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OneDrive\Documents\AURIS\deploy_all.ps1"
```

This single command will:
1. Initialize local Git boundaries in `/server`, `/edge`, and `/` root.
2. Link them to their respective designated remote urls.
3. Automatically stage, commit, and force-push all local clean code updates!

---

## 🤖 AI Context Handoff
For other AI agents (Cursor, ChatGPT, Claude) working inside this folder, please refer to:
*   **[`AI_CONTEXT.md`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/AI_CONTEXT.md)**: A complete technical specification sheet mapping core features, parameters, data structures, and immediate tasks to ensure 100% continuous AI alignment.
