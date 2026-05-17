# AURIS — HANDOVER & LATEST MASTER CHANGES DOCUMENT
**Last Updated:** May 17, 2026 (22:50 IST)
**Current Status:** Production-Ready Edge-Cloud Pipeline Active. System Integration fully converged. Concurrent parallel priority queue worker deployed.

This document compiles all recent structural changes, feature additions, architecture updates, deployment actions, and custom tools to ensure a seamless continuation later.

---

## 1. Public Portals and DNS Mapping
The routing and deployment endpoints have been successfully segregated and pushed live:
*   **Admin/HQ Hub:** [https://hq.skymlabs.com](https://hq.skymlabs.com)
    *   *Purpose:* Store provisioning, room/floor-plan mapping uploads, camera pinning, GCP calibration, training reviews.
*   **Customer Analytics Portal:** [https://auris.skymlabs.com](https://auris.skymlabs.com)
    *   *Purpose:* Read-only live telemetry, animated dots on floor plans, daily reports, historical peak hour analytics.
*   **API / FastAPI Cloud backend:** reverse-proxied and served at `https://auris.skymlabs.com/api` (Azure VM: Central India).

---

## 2. Key Code Changes & Additions (Completed Today)

### A. Core Backend Routing Convergence (Integration Alignment)
*   **Files Modified:** [main.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/main.py), [admin.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/routes/admin.py)
*   **The Issue:** Frontends made API calls to `/admin/stores` (without `/api` prefix), while the uvicorn backend registered them as `/api/admin/stores`.
*   **Resolution:**
    1. Removed the `/api` prefix from route decorators inside [admin.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/routes/admin.py).
    2. Mounted the `admin.router` twice inside [main.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/main.py): once under the root path `/` and once under `/api` prefix.
    3. Seamlessly supports both routing variants on local dev and production behind Nginx without changing frontends or proxy rules.

### B. High-Throughput 12-Camera Parallel Keyed Priority Queue
*   **File Modified:** [frames.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/routes/frames.py)
*   **The Issue:** Single-threaded sequential frames worker collapsed under high ingestion volume of 12-camera factories. Arbitrary parallel workers corrupted object tracking (DeepSort requires stream frames to be processed strictly chronologically).
*   **Resolution:**
    1. Initialized `NUM_WORKERS = 12` parallel worker tasks in the background for multi-camera processing.
    2. Implemented Key-based Locking & Parking: A worker locks the stream `store_id + camera_id` while processing, and parks incoming frames for the same stream in a stream-specific FIFO queue (`pending_by_key`) to preserve chronological sequencing.
    3. Expanded backpressure smart-dropping thresholds to evaluate global + parked queue depths (`get_total_queued_frames()`).

### C. Security Hardening & Secret Protection
*   **File Modified:** [auris-hq.service](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/auris-hq.service)
*   **Action:** Masked the hardcoded GEMINI_API_KEY with a safe placeholder to clear GitHub Push Protection blockages. Soft-reset git history by 1 commit locally to clear cached history.

### D. Automated Multi-Repo Push Synchronization
*   **Status:** **Fully Synced & Confirmed**. Running [deploy_all.ps1](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/deploy_all.ps1) successfully pushed all modifications to:
    *   `auris-server` GitHub Repo (Server files)
    *   `DOWNLOAD-AURIS-` GitHub Repo (Edge files)
    *   `MY-AURIS` GitHub Repo (Master monorepo)

---

## 3. How to Deploy the Latest Changes

If you make modifications to the dashboards locally, run these direct PowerShell scripts from `C:\Users\SAKSHAM\auris-app` to compile and push the updates live:

```powershell
# 1. Update HQ Dashboard (https://hq.skymlabs.com)
powershell -ExecutionPolicy Bypass -File .\build_and_deploy_hq.ps1

# 2. Update Customer Portal (https://auris.skymlabs.com)
powershell -ExecutionPolicy Bypass -File .\build_and_deploy_customer.ps1
```

To sync code changes across all repositories, run:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\SAKSHAM\OneDrive\Documents\AURIS\deploy_all.ps1"
```

---

## 4. Live Verification Summary
Our automated browser agent successfully logged into the command hub:
*   **HQ Command Portal:** Zero 502/404 errors. Completely stable.
*   **Dynamic Fetch:** Live stores retrieved, parsed, and coordinate-mapped perfectly.
*   **Queue Telemetry:** System initialized with 12 parallel threads active and listening.
*   **Live Walkthrough:** Saved as [walkthrough.md](file:///C:/Users/SAKSHAM/.gemini/antigravity/brain/c538948e-f1ab-45c5-9737-e23844284c22/walkthrough.md) in the active conversation brain folder.
