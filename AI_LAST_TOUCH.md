# AURIS — HANDOVER & LATEST MASTER CHANGES DOCUMENT
**Last Updated:** May 17, 2026

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

## 2. Key Code Changes & Additions

### A. Dynamic API Endpoint Detection
*   **File Modified:** [App.jsx](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/auris-hq/src/App.jsx) (and synced to local `auris-app` workspace).
*   *Change:* Updated the `API` base URL constant to dynamically sense its environment:
    ```javascript
    const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : 'https://auris.skymlabs.com';
    ```
    This completely eliminates the need to edit manual URL configurations when switching between local debugging and production deployment.

### B. Interactive PDF Map Digitizer Tool
*   **File Added:** [digitize_map.py](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/digitize_map.py) (and synced to local `auris-app` workspace).
*   *Purpose:* A standalone click-based OpenCV utility that allows taking a screenshot of *any* floor plan blueprint PDF and converting it into calibrated metric metric-coordinate JSON.
*   *Key Features:*
    1.  **Metric Calibration:** Calculates `pixels_per_meter` by letting you click 2 points of a known distance.
    2.  **Point Tracing:** Interactive clicking for Boundaries (outer polygon), Wall Segments (line-pairs), Openings/Doors (blue line-pairs), and Obstacles (red filled polygons).
    3.  **JSON Export:** Outputs a schema-compliant `floor_plan.json` ready for direct paste and upload in the HQ Portal scan box.

### C. Automatic Build & Deploy Pipelines
*   **File Added:** [build_and_deploy_hq.ps1](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/build_and_deploy_hq.ps1)
    *   Builds the Vite static assets for `auris-hq` and deploys to `/var/www/auris-hq` on the Azure VM.
*   **File Added:** [build_and_deploy_customer.ps1](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/build_and_deploy_customer.ps1)
    *   Compiles the React Native/Expo Web bundles and deploys to `/var/www/auris` on the Azure VM.

### D. Repository Synchronization & Push Protections
*   **File Modified:** [SYSTEM_DESIGN.md](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/SYSTEM_DESIGN.md)
    *   Masked the raw Groq API key in the configuration metadata, eliminating the GitHub secret leakage blocking rule.
*   *Status:* **Successfully synchronized & force-pushed** to the master monorepo `MY-AURIS` as well as subfolders `auris-server` and `DOWNLOAD-AURIS-`. All histories are 100% clean and fully up-to-date.

---

## 3. How to Deploy the Latest Changes

If you make modifications to the dashboards locally, run these direct PowerShell scripts from `C:\Users\SAKSHAM\auris-app` to compile and push the updates live:

```powershell
# 1. Update HQ Dashboard (https://hq.skymlabs.com)
powershell -ExecutionPolicy Bypass -File .\build_and_deploy_hq.ps1

# 2. Update Customer Portal (https://auris.skymlabs.com)
powershell -ExecutionPolicy Bypass -File .\build_and_deploy_customer.ps1
```

---

## 4. How to Digitize a Map Blueprint

1. Take a screenshot of the floor plan PDF/image and place it in the folder `C:\Users\SAKSHAM\auris-app\` as `map.png` or `map.jpg`.
2. Run the digitizer:
   ```powershell
   cd c:\Users\SAKSHAM\auris-app
   python .\digitize_map.py
   ```
3. Follow the visual prompts to:
   - Click two points on the scale bar (or a wall of known size) and type the metric distance (e.g. `5.5`) in your terminal.
   - Click sequential corners to draw the Outer Boundary (`ENTER` to close).
   - Click point-pairs to draw Walls (`ENTER` to close).
   - Click point-pairs to draw Openings/Doors (`ENTER` to close).
   - Outline obstacles, pressing `c` to complete each obstacle, and `ENTER` to complete.
4. Copy the resulting `floor_plan.json` and paste it into the **Guided Scan Upload** tab in [hq.skymlabs.com](https://hq.skymlabs.com).

---

## 5. Next Steps for Development

1. **GCP Homography Canvas Integration:** Let the users link 4 points on the snapshot to physical metres in the browser.
2. **OSNet Re-ID Model:** Once a Google Cloud GPU is active, implement the Re-ID embedding tracker in the inference worker loop (`reid_worker.py`).
