# Auris Master AI Handover & Context Blueprint
> **Last Updated**: 2026-05-17T18:04 IST
> **System Status**: Production-Ready Edge-Cloud Pipeline Active. Monorepo Consolidated. Phase 2 (Spatial Intelligence) In Progress.
> **Document Purpose**: Single-Source-of-Truth for ALL AI Agents (Cursor, Claude, GPT). Read this FIRST before touching any file.

---

## 0. Critical Rules for All Agents

1. **ALWAYS edit inside `C:\Users\SAKSHAM\OneDrive\Documents\AURIS`** — this is the canonical workspace. Do NOT edit inside `C:\Users\SAKSHAM\Auris`, `auris-server`, or `auris-app` directly.
2. **Each agent owns exactly one subfolder** — see Section 4. Never write to another agent's folder.
3. **After finishing any task**, tell the user to run: `powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OneDrive\Documents\AURIS\deploy_all.ps1"` to sync all three GitHub repos simultaneously.
4. **Read `AI_AGENT_WORKSTREAMS.md`** for task-level assignments before writing any code.

## Public Deployment

- **Admin/HQ portal** (central hub for provisioning, mapping, camera pinning, training, etc.): **https://hq.skymlabs.com**
- **Customer analytics portal** (read‑only visualisations, live floor maps, heatmaps): **https://www.auris.skymlabs.com**

---

## 1. Repository Map

| Local Folder | GitHub Repo | Ownership |
|---|---|---|
| `AURIS/server/` | [auris-server](https://github.com/sakshamshh/auris-server) | Agent 2 |
| `AURIS/edge/` | [DOWNLOAD-AURIS-](https://github.com/sakshamshh/DOWNLOAD-AURIS-) | Agent 1 |
| `AURIS/` (root) | [MY-AURIS](https://github.com/sakshamshh/MY-AURIS) | Master Monorepo |
| `AURIS/dashboard/` | Part of MY-AURIS | Agent 3 |

### Full Directory Tree
```
C:\Users\SAKSHAM\OneDrive\Documents\AURIS\
├── AI_CONTEXT.md              ← THIS FILE. Always keep updated.
├── AI_AGENT_WORKSTREAMS.md    ← Per-agent task assignments
├── README.md                  ← Public-facing monorepo landing page
├── deploy_all.ps1             ← One-click push to all 3 GitHub repos
│
├── server/                    ← Cloud FastAPI Backend (Agent 2)
│   ├── main.py                ← FastAPI app entry point
│   ├── db.py                  ← MongoDB/Cosmos DB async client
│   ├── requirements.txt
│   ├── routes/
│   │   ├── frames.py          ← CORE: YOLOv8 + DeepSort ingest
│   │   ├── calibration.py     ← GCP save, homography solve, QR gen, SfM trigger
│   │   ├── training.py        ← Hard cases, pseudo labels, YOLO export
│   │   ├── analytics.py       ← Historical metrics queries
│   │   ├── alerts.py          ← Fire/safety alert stubs
│   │   ├── spatial.py         ← Floor map upload route
│   │   └── admin.py           ← Factory provisioning
│   ├── spatial/
│   │   ├── homography.py      ← solve_homography(), norm_to_metres(), detect_qr_scale()
│   │   └── sfm.py             ← run_sfm_calibration() ORB+RANSAC
│   └── services/
│       ├── auto_calibrator_job.py
│       └── reid_worker.py     ← OSNet Re-ID stub (to be implemented)
│
├── edge/                      ← N100 Local Worker (Agent 1)
│   ├── src/
│   │   ├── edge_worker.py     ← CORE: multi-thread camera capture + MOG2 + uploader
│   │   └── config.py          ← RTSP camera stream list (production)
│   ├── install_edge.sh        ← One-click Ubuntu deployer
│   └── auris-edge.service     ← systemd daemon file
│
└── dashboard/                 ← Visual Frontends (Agent 3)
    ├── auris-hq/              ← Vite + React web admin portal
    │   └── src/
    │       ├── App.jsx        ← CORE: All screens (calibration, map, heatmap, training)
    │       └── index.css      ← Design system (dark mode, tokens)
    └── src/screens/           ← React Native Expo mobile screens
        ├── DashboardScreen.js
        ├── CalibrationScreen.js
        ├── MapScreen.js
        ├── TrainingReviewScreen.js
        └── AdminScreen.js
```

---

## 2. Technical Specifications

### 2.1 Edge Worker (`edge/src/edge_worker.py`)
- **CameraWorker**: One thread per RTSP stream. Captures at 2 FPS.
- **Capture backend**: `cv2.CAP_DSHOW` on Windows, `cv2.CAP_FFMPEG` for RTSP on Linux.
- **Motion detection**: `cv2.createBackgroundSubtractorMOG2`. Contours with `area > 500px` only.
- **Upload**: `FrameUploader` thread. Posts base64 JPEG crops + metadata to `POST /api/frames`.
- **Buffer**: SQLite `frame_buffer.db`. Drop-on-full policy. Retry loop every 15s.
- **Headers sent**: `X-API-Key`, `X-Store-ID`, `X-Camera-ID`, `X-Frame-ID`.

### 2.2 Cloud Server (`server/routes/frames.py`)
- **Auth**: `X-API-Key` header → MongoDB store lookup.
- **Inference**: `asyncio.run_in_executor` thread pool. YOLOv8m `conf=0.45, classes=[0]`.
- **Tracking**: `DeepSort` instance per `camera_id` in `trackers: Dict[str, DeepSort]`.
- **Coordinate clamping**: All bbox coords cast to `int()`, clamped to `[0, W-1]` / `[0, H-1]`.
- **DB output**: Pushes tracking doc to MongoDB with `track_id`, `bbox`, `confidence`, `timestamp`.

### 2.3 Calibration System (`server/routes/calibration.py` + `server/spatial/`)
- **GCP endpoint**: `POST /api/calibration/gcp` — saves 4+ pixel↔metre point pairs.
- **Solve endpoint**: `POST /api/calibration/solve` — calls `solve_homography()`, stores 3×3 matrix.
- **QR scale**: `detect_qr_scale()` in `spatial/homography.py` — reads printed A4 QR, computes `m/px`.
- **SfM fallback**: `POST /api/calibration/run` — `run_sfm_calibration()` uses ORB+RANSAC across 48h frames.
- **Coordinate projection**: `norm_to_metres(H, cx, cy)` → real-world `(x_m, y_m)`.

### 2.4 Floor Map Strategy (DECIDED: Smartphone AR)
- **Tool**: Polycam or Magicplan app on any Android/iOS device.
- **Process**: Walk factory for 5 mins → export SVG/PNG blueprint.
- **Upload**: `POST /api/spatial/upload-map?floor_id=floor_0` (Agent 2 to implement).
- **Dashboard use**: SVG is the static background canvas. Live person dots overlay at `(x_m * scale, y_m * scale)` CSS position.

### 2.5 Self-Training Pipeline (`server/routes/training.py`)
- **Hard cases**: `conf 0.30–0.50` → `save_hard_case()` → stored in `db.hard_cases` (cap: 10,000).
- **Pseudo labels**: `conf > 0.85` → `save_pseudo_label()` → stored in `db.pseudo_labels` (cap: 50,000).
- **Review**: `GET /api/training/hard-cases` → admin sees crops, clicks approve/reject.
- **Export**: `POST /api/training/export-yolo` → generates YOLO manifest for GPU training job.

---

## 3. Phase 2 Task Status

| Task | Agent | Status | Target File |
|---|---|---|---|
| **iPhone LiDAR floor plan ingest API** | Codex | ✅ DONE | `server/routes/mapping.py` |
| **Dashboard mapping UI + live floor tab** | Codex | ✅ DONE | `dashboard/auris-hq/src/App.jsx` |
| Homography Calibration Canvas UI | Agent 3 | 🟡 NEXT | `dashboard/auris-hq/src/App.jsx` |
| Real-world coord mapper in frames.py | Agent 2 | 🔴 NOT STARTED | `server/routes/frames.py` |
| OSNet Re-ID integration | Agent 2 | 🔴 NOT STARTED | `server/services/reid_worker.py` |
| Self-training hook in frames.py | Agent 2 | 🔴 NOT STARTED | `server/routes/frames.py` |
| Edge SQLite garbage collector | Agent 1 | 🔴 NOT STARTED | `edge/src/edge_worker.py` |
| Thermal heatmap overlay | Agent 3 | 🔴 NOT STARTED | `dashboard/auris-hq/src/App.jsx` |
| Training review admin screen | Agent 3 | 🔴 NOT STARTED | `dashboard/auris-hq/src/App.jsx` |

---

## 5. Codex Mapping Implementation (COMPLETED 2026-05-17)

Codex (Agent 2) implemented the full iPhone LiDAR / RoomPlan ingest pipeline:

### Server: `server/routes/mapping.py`
- `POST /api/mapping/floorplan` — accepts `FloorPlanUpload` Pydantic model with:
  - `boundary` polygon (list of `{x_m, y_m}` points)
  - `walls` and `openings` as `MapSegment` pairs
  - `obstacles` as polygon lists
  - `source`, `confidence`, `scan_id`, optional `raw_roomplan`
- Normalizes all coordinates to origin `(0,0)`, computes bounds width/height.
- Runs `_quality()` to detect closed-loop status, dangling walls, area, perimeter.
- Stores into `db.floors` (upsert by `store_id + floor_id`) and `db.mapping_scans` (full history).
- `GET /api/mapping/floorplan?floor_id=floor_0` — retrieves stored plan.

### Dashboard: `dashboard/auris-hq/src/App.jsx` (rebuilt by Codex)
- **LiDAR Map tab**: Paste/import JSON from phone. Sample room scan included. Live SVG preview. Upload button → `POST /api/mapping/floorplan`.
- **Live Floor tab**: Live dot positions + heatmap overlay rendered on same map coordinate system.
- Vite dev server confirmed running at `http://127.0.0.1:5173`.

### What Codex did NOT build (still pending):
- The actual iPhone app that generates the LiDAR JSON (needs native Swift / RoomPlan API work).
- Homography GCP calibration canvas (4-point click UI).
- Self-training hooks inside `frames.py`.

---

## 4. Agent Assignments Summary

**Agent 1** → `edge/` only. Repos: `DOWNLOAD-AURIS-`.
**Agent 2** → `server/` only. Repo: `auris-server`.
**Agent 3** → `dashboard/auris-hq/` only. Repo: `MY-AURIS`.

All agents sync via: `deploy_all.ps1` in AURIS root.
