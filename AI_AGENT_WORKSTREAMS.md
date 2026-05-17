# AURIS Multi-Agent Orchestration & Workstream Handoff
> **Active Workspace**: `C:\Users\SAKSHAM\OneDrive\Documents\AURIS`
> **Coordination Strategy**: Complete thread-isolation across 3 parallel AI Agents to prevent git conflicts and maximize implementation speed.

---

## 🏛️ Current Operational Status
*   **Edge Pipeline**: Completed. Runs multi-threaded frame capture with DirectShow Windows support, MOG2 subtraction, base64 crop uploader, and active SQLite network buffer recovery.
*   **Cloud API Pipeline**: Completed. Standard FastAPI ingest takes crops, runs YOLOv8m + DeepSort tracking, checks entrance line crossings, and exports Cosmos DB documents.
*   **Directory Consolidation**: Consolidated! All active codebases are clean, stripped of venv/node_modules, and linked directly to their target repositories.

---

## 👥 Multi-Agent Workstream Allocations

To prevent any file write collisions, the engineering roadmap is divided into three completely independent domains:

```
                  ┌──────────────────────────────────────────┐
                  │          AURIS MASTER MONOREPO           │
                  │   https://github.com/sakshamshh/MY-AURIS │
                  └────────────────────┬─────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
 ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
 │    AGENT 1    │             │    AGENT 2    │             │    AGENT 3    │
 │  Edge Node    │             │   Cloud API   │             │   Dashboards  │
 │  DOWNLOAD-    │             │  auris-server │             │   MY-AURIS    │
 └───────────────┘             └───────────────┘             └───────────────┘
```

---

### 💻 AGENT 1: The Edge Node Specialist
*   **Operating Repository**: [`sakshamshh/DOWNLOAD-AURIS-`](https://github.com/sakshamshh/DOWNLOAD-AURIS-)
*   **Target Subfolder**: [`edge/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/edge)
*   **Target Files**:
    *   [`edge/src/edge_worker.py`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/edge/src/edge_worker.py)
    *   [`edge/src/config.py`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/edge/src/config.py)
    *   [`edge/install_edge.sh`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/edge/install_edge.sh)

#### 📝 Handoff & Immediate Tasks:
1.  **Failover & Reconnect Audits**: Improve connection resilience. If a camera thread drops (e.g. RTSP timeout), verify that the worker retries every 5 seconds without bottlenecking or crashing the rest of the camera worker threads.
2.  **Edge Performance Calibration**: Fine-tune the MOG2 background subtractor parameters (detect shadows, learning rate) inside `CameraWorker.extract_crops` to optimize N100 CPU usage.
3.  **Local SQLite Garbage Collection**: Implement a cleanup job inside `FrameUploader` that automatically purges oldest raw base64 strings in the SQLite database if network disconnection lasts for more than 48 hours, keeping the local N100 storage safe.

---

### 🧠 AGENT 2: The Cloud API & Geometrics Engine
*   **Operating Repository**: [`sakshamshh/auris-server`](https://github.com/sakshamshh/auris-server)
*   **Target Subfolder**: [`server/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server)
*   **Target Files**:
    *   [`server/routes/frames.py`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/routes/frames.py)
    *   [`server/spatial/homography.py`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/spatial/homography.py)
    *   [`server/routes/training.py`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/server/routes/training.py)

#### 📝 Handoff & Immediate Tasks:
1.  **Top-Down Coordinate Mapper**: Update `routes/frames.py`. Fetch the camera’s homography matrix from the database, isolate the feet bounding coordinate of every person, multiply it using `norm_to_metres()`, and store the real-world `(x_meters, y_meters)` projection inside the active DB frame document.
2.  **OSNet Re-ID Integration**: Load pre-trained `OSNet` embeddings model on the server. Extract 512-dim appearance features for new tracks, store lost track embeddings in a rolling cache, and override new track IDs when matched with similarity $> 85\%$.
3.  **YOLO Self-Training Hook**: Hook up low-confidence YOLO boxes ($0.3 \le \text{conf} \le 0.5$) to automatically save as pending `hard_cases`, and high-confidence boxes ($> 0.85$) as auto-labeled `pseudo_labels`.

---

### 🎨 AGENT 3: The Frontends & Visualizations Master
*   **Operating Repository**: [`sakshamshh/MY-AURIS`](https://github.com/sakshamshh/MY-AURIS) (Master Monorepo)
*   **Target Subfolder**: [`dashboard/`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard)
*   **Target Files**:
    *   [`dashboard/auris-hq/src/App.jsx`](file:///C:/Users/SAKSHAM/OneDrive/Documents/AURIS/dashboard/auris-hq/src/App.jsx)
    *   `dashboard/auris-hq/src/index.css`

#### 📝 Handoff & Immediate Tasks:
1.  **Homography Calibration Canvas**: Replace the static calibration interface with an interactive HTML5 canvas. Pull calibration snapshots from `/api/calibration/snapshot`, allow users to click 4 points on the image, input their real-world distance inputs (in meters), and POST them to `/api/calibration/homography`.
2.  **The GTA Live Dot Floor Plan**: Build a clean 2D floor layout canvas that displays live dot indicators moving in real-time, mapping their positions dynamically based on projected `(x_meters, y_meters)` coordinates.
3.  **Real-Time Thermal Heatmap**: Fetch historical tracking metrics to compile a spatial traffic grid, overlaying a custom colored thermal gradient (cool blue, yellow, warm red) directly on the SVG floor plan.

---

## 🛠️ Synchronization Protocol

When any agent finishes making changes within their designated directory, they **must** tell the user to run the master sync command:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OneDrive\Documents\AURIS\deploy_all.ps1"
```

*This will automatically stage, compile, and force-push all respective subfolders to the correct Git remotes, keeping all agents fully updated and synchronized in real-time!*
