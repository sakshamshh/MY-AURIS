# AURIS BY SKYM LABS — COMPLETE SYSTEM DESIGN
Last updated: May 17, 2026

---

## FOUNDERS
- Saksham (CEO) — Thapar Institute, Electrical Engineering
- Ayush (CTO) — Amity University Noida, CSE

## LIVE INFRASTRUCTURE
- Dashboard: https://auris.skymlabs.com
- Server: Azure VM B2as v2, 98.70.41.191, Central India
- SSH: ssh -i "C:\Users\SAKSHAM\.ssh\retailiq_key.pem" retailiq-key@98.70.41.191
- SSH shortcut: ssh retailiq-server
- DB: Cosmos DB, Serverless, Central India
- Admin key: dcd62cb40e5fa0870d73c79fbd521d05
- Test store: test_store2 / test123
- Test API key: sk_VWCM3Zgf3-YJLnTf6v5CvulCsaySImSXAXosvbiB3LI
- Tailscale: laptop (100.120.225.27) + server (100.78.210.18)
- Groq API: gsk_**************************************************** (set in VM env variables)
- GitHub: https://github.com/sakshamshh/AURIS


---

## CURRENT ARCHITECTURE (WORKING END TO END)

Edge device (N100, Rs 9,500):
- edge_worker.py — OpenCV MOG2 background subtraction
- Extracts motion crops (JPEG q60, max 320x320)
- Sends base64 crops to /api/frames
- SQLite offline buffer (5000 rows, 15s retry)
- Adaptive FPS (drops to 0.5 when queue full)
- 48-hour calibration mode (sends full frames + crops)
- OTA updates via updater.py (git pull + restart hourly)
- Auto-switch calibration mode after 48h (writes to .env)
- install.sh on GitHub for one-command install
- auris-edge.service systemd for auto-start

Cloud server (FastAPI):
- /api/frames — receives crops, runs YOLOv8m, DeepSort, stores blobs
- /api/today, /api/hourly, /api/zones, /api/live — analytics
- /api/report — Groq Llama 3.3 70B AI daily report
- /api/login — store auth
- /admin/stores — create/list/delete stores
- routes/frames.py — YOLOv8m inference, per-camera DeepSort, zone events, entry/exit counting, fire detection stub
- routes/analytics.py — all analytics queries (group by camera_id)
- routes/admin.py — store management
- routes/auth.py — login
- routes/blobs.py — legacy blob receiver
- routes/report.py — AI report
- db.py — Cosmos DB connection, bcrypt auth helpers

Dashboard (React Native / Expo):
- Login screen
- Dashboard — metrics, hourly chart, cameras, zones
- AI Report tab
- Admin panel — create/delete stores, admin key protected
- Deployed at auris.skymlabs.com via deploy.ps1

---

## SERVER FILE LOCATIONS
- /home/retailiq-key/auris-server/main.py
- /home/retailiq-key/auris-server/routes/frames.py
- /home/retailiq-key/auris-server/routes/analytics.py
- /home/retailiq-key/auris-server/routes/admin.py
- /home/retailiq-key/auris-server/routes/auth.py
- /home/retailiq-key/auris-server/routes/blobs.py
- /home/retailiq-key/auris-server/routes/report.py
- /home/retailiq-key/auris-server/db.py
- /home/retailiq-key/auris-server/.env
- /var/www/auris/ — web files
- /etc/systemd/system/auris.service

## LOCAL FILE LOCATIONS
- C:\Users\SAKSHAM\Auris\src\edge_worker.py
- C:\Users\SAKSHAM\Auris\src\config.py
- C:\Users\SAKSHAM\Auris\src\updater.py
- C:\Users\SAKSHAM\Auris\src\auto_calibrator.py
- C:\Users\SAKSHAM\Auris\.env
- C:\Users\SAKSHAM\Auris\install_edge.sh
- C:\Users\SAKSHAM\Auris\auris-edge.service
- C:\Users\SAKSHAM\auris-app\ — React Native app
- C:\Users\SAKSHAM\auris-app\deploy.ps1

---

## PHASE 2 — SPATIAL INTELLIGENCE (TO BUILD)

### Full Vision
A self-aware, spatially intelligent camera network that:
1. Installs with one QR code per floor stuck on wall
2. Calibrates itself in 48 hours
3. Generates a living floor map (GTA minimap)
4. Tracks every person in real-world metres (not pixels)
5. Knows when same person moves between cameras (Re-ID)
6. Shows live animated dots on floor plan + heatmap overlay
7. Gets smarter every month via self-training pipeline
8. Alerts instantly via WhatsApp — fire, overcrowding, camera offline
9. Reports every night with spatial context

### Component 1 — Automatic Floor Mapping

Near term (QR code + SfM):
- Print one A4 QR code per floor (encodes floor ID + known size 29.7cm)
- During 48h calibration, server detects QR in full frames
- Computes scale from known QR size automatically
- SfM algorithm analyses multiple camera frames of same space
- Computes relative camera positions + orientations
- Outputs unified coordinate system for all cameras
- Accuracy: 88-92%

Long term (LiDAR buggy):
- Small wheeled robot (Rs 16,000): RPLIDAR A1 + Raspberry Pi + wheels
- Place at factory entrance, press start
- SLAM algorithm builds exact 2D floor plan in 20-30 min
- 2cm accuracy
- Uploads map to server via WiFi
- One buggy for all installations
- QR codes still used for camera registration
- Future Skym Labs standalone product

### Component 2 — Unified Coordinate System
- Every camera gets homography matrix from SfM/QR detection
- Every pixel → real-world (x metres, y metres) from entrance (0,0)
- Multi-floor: each floor has own 2D coordinate space
- Cameras auto-assigned to floors by mount height
- All cameras speak same coordinate language (like Pokemon Go)

### Component 3 — Cross-Camera Re-ID (OSNet)
- OSNet extracts 512-dim appearance embedding per person
- Cosine similarity match when person moves between cameras
- Same track ID across entire building
- No double counting across blind spots
- REQUIRES Google Cloud GPU first (Azure B2as v2 too slow)

### Component 4 — Self-Training Pipeline
Collection (continuous):
- conf < 0.50 → save to hard_cases (cap 10,000)
- conf > 0.85 → save to pseudo_labels (cap 50,000)

Review (monthly, ~1 hour):
- Admin panel shows hard case crops
- Click approve/reject
- 3 seconds per case

Training (automatic monthly cron):
- Combines approved cases + pseudo labels
- Generates YOLO format labels
- Runs model.train() on Google Cloud GPU overnight
- Outputs yolov8m-auris-v2.pt
- Deployed OTA to all servers

### Install Process (Final Version)
Bring: N100 mini PC + printed QR codes + laptop
1. Stick QR code on wall per floor — 2 min
2. Plug in N100, connect to NVR
3. Run install.sh, enter store ID
4. Walk away
System does everything else automatically

### Build Order
1. QR code detection in calibration frames — 2 days
2. SfM coordinate system computation — 3 days
3. Homography mapper in frames.py — 1 day
4. Floor map SVG generator — 2 days
5. Live dot map + heatmap in dashboard — 3 days
6. OSNet Re-ID (after Google Cloud GPU) — 3 days
7. Self-training pipeline — 1 week
8. LiDAR buggy (after first 3 paying factory customers)

---

## NEW SERVER ROUTES TO BUILD
- routes/calibration.py — QR detection, homography computation, floor config
- routes/spatial.py — coordinate mapper, SVG floor map, heatmap, live positions
- routes/alerts.py — WhatsApp via Twilio, fire/overcrowding/offline alerts
- routes/training.py — hard case collector, pseudo-label generator, review UI

## DASHBOARD SCREENS TO BUILD
- Homography calibration screen (click 4 points on camera snapshot)
- GTA minimap (live SVG with animated dots, refreshes every 2s)
- Heatmap overlay (builds up over day)
- Floor switcher (toggle between floors)
- Alert history
- Training review (approve/reject hard cases)

---

## BUSINESS MODEL

Auris Retail: Rs 12,000-20,000/store/month
- Footfall counting, zone heatmaps, AI daily report, peak hour analysis
- Setup: Rs 45,000 (waived pilot #1)
- Hardware COGS: Rs 9,500, sell at Rs 25,000

Auris Factory: Rs 75,000-1,50,000/factory/month
- Everything in retail + spatial map + fire detection + worker monitoring + compliance PDF
- Setup: Rs 1,50,000
- Hardware COGS: Rs 9,500, sell at Rs 40,000

---

## FREE CREDITS / RESOURCES
- Azure for Students: $100/year
- GitHub Student Pack: until April 28, 2028
- Groq API: free tier
- Google Cloud: $300 free (apply now at cloud.google.com/free)
- Google for Startups: $2,000 Bootstrap tier (apply at cloud.google.com/startup)
- NVIDIA Inception: applied
- Tailscale: free (3 devices — laptop + server, 1 slot left)
