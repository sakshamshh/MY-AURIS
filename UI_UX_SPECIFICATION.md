# AURIS — PREMIUM UI/UX SPECS & AI CODE GENERATION BLUEPRINT
**Theme:** "Quantum Grid" (Aero-Cyberpunk, Sleek HSL Glassmorphism, Micro-Interactive Telemetry)

This document provides a highly detailed design system, layout framework, and **exact copy-pasteable prompts** for AI generation tools (like **v0.dev**, **Claude 3.5 Sonnet**, or **Cursor**) to build a world-class, premium UI/UX from the login screen to the spatial dashboard.

---

## 1. Visual Identity & Design Tokens

To achieve a "sexy and premium" look that feels like a multi-million dollar high-tech dashboard (think Apple, Vercel, or high-end game minimaps like Cyberpunk/GTA), we use these exact design tokens:

### A. Color Palette (Sleek HSL)
*   **Space Background:** `hsl(240, 10%, 3.9%)` (Pure dark, slightly blueish black)
*   **Card Background (Glass):** `hsla(240, 10%, 10%, 0.65)` with `backdrop-filter: blur(12px)`
*   **Active Cyan (Hologram):** `hsl(180, 100%, 50%)` (Glows for live tracking dots, calibrated nodes)
*   **Laser Purple (Telemetry):** `hsl(270, 100%, 60%)` (Glows for camera fields of view, alerts)
*   **Warning Orange (Fire/Alert):** `hsl(30, 100%, 50%)`
*   **Premium Border:** `hsla(240, 5%, 80%, 0.08)` (Ultra-thin elegant card boundaries)

### B. Micro-Animations & Transitions
*   **Soft Spring Hover:** `transform: scale(1.02); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);`
*   **Hologram Scanning Pulse:** A periodic subtle scanline sliding down the login screens.
*   **Radar Sweeper:** A rotating gradient overlay on maps that creates a glowing radar sweep.

---

## 2. Interactive Design Prompts for AI Builders

Copy and paste these exact prompts into **v0.dev**, **Claude**, or **Cursor** to build the corresponding components:

### 🚀 PROMPT 1: The Cyber-Glassmorphic Login Screen (HQ & Client)
*Use this prompt to generate a beautiful, modern, high-tech login portal:*

```text
Build a premium, high-tech, dark-themed login component in React with Tailwind CSS and Lucide icons.
The aesthetic should be "Aero-Cyberpunk" using HSL colors. 

Key Visual Elements:
1. BACKGROUND: Pure dark space color (hsl(240, 10%, 4%)) with a subtle, glowing network mesh or floating grid pattern generated using a simple CSS canvas or animated SVG paths.
2. GLASS CARD: A centered, glassmorphic card (backdrop-filter: blur(12px), border: 1px solid rgba(255,255,255,0.06)).
3. LOGO AREA: A sleek logo slot with a glowing, pulsing Cyan halo (hsl(180, 100%, 50%)) and the text "AURIS BY SKYM LABS" in an elegant monospaced font.
4. INPUT FIELDS: Clean, minimal input inputs with floating labels. When focused, the input borders should smoothly glow with a Cyber-Cyan laser highlight, and show a micro-hologram icon at the right edge.
5. BUTTON: A primary "AUTHORIZED LOGIN" button with a sleek linear gradient from deep blue to purple (hsl(270, 100%, 60%)). Implement a magnetic hover effect (translating slightly toward the cursor) and a glowing scanline animation running across the button text periodically.
6. FOOTER: A tiny, high-tech footer displaying: "SYSTEM CORRELATION ACTIVE | v2.0.0".

Ensure it has extremely smooth CSS transitions, feels premium, and uses Outfitters or Inter font styles. No generic elements.
```

---

### 🎨 PROMPT 2: The Floor-Stitching Calibration Control Center
*Use this prompt to build the admin canvas where maps are stitched together:*

```text
Build an interactive "Floor Stitching & Camera Calibration" control interface in React with Tailwind CSS.

Key Layout Elements:
1. TWO-COLUMN LAYOUT: 
   - Left Sidebar: Config panel with glass cards, sliders for Offset-X, Offset-Y, Scale, Rotation angle. Let the sliders have glowing active tracks and a live value readout.
   - Right Main Panel: A massive dark viewport container (simulating the map coordinate system).
2. GRAPH PAPER CANVAS: The map viewport must have a subtle glowing coordinates grid (like a blueprint or vector canvas) with an interactive 2D canvas inside.
3. MULTI-MAP STITCHING PREVIEW: Render two floorplans (SVG polygons). Let the active floor plan be draggable inside the viewport using mouse coordinates or sliders, showing a sleek overlapping grid overlay.
4. ROTATION WHEEL: Provide a futuristic circular dial control in the config panel that lets users rotate the active map, showing visual degree increments.
5. TABS: Futuristic administrative header with glowing tab selectors: [Guided Scan], [Stitch Calibration], [Camera Registry], [Model Refinement].

Make the UI feel like an advanced tactical commander's center. Include glowing active states and sleek vector micro-interactions.
```

---

### 🗺️ PROMPT 3: The GTA-Style Real-time Minimap & Heatmap Dashboard
*Use this prompt to build the main tracking layout for analytics:*

```text
Build a premium spatial dashboard with a Real-time "GTA-style" floor minimap using React and Tailwind CSS.

Key Features:
1. MAIN CONTAINER: Full-screen dashboard styled with ultra-thin, low-opacity borders separating sections.
2. LEFT TELEMETRY FEED: 
   - A live "Person Feed" listing active tracks (e.g. "Track #1024 - Entered Camera 2").
   - A live "Camera Grid" displaying active video snapshots or stub video feeds with green "LIVE" badges and glowing recording indicators.
3. CENTRAL MAP COMPONENT:
   - A large SVG floor-plan viewer showing outer walls, inner walls, and active camera cones (semi-transparent purple arcs with glowing laser lines indicating the field of view).
   - Animated target beacons: When a person moves, render a glowing Cyan circle (hsl(180,100%,50%)) with a pulsing wave halo radiating outward from the dot.
   - Radar Sweep: A continuous, subtle, sweeping light overlay running across the floor map.
4. THERMAL HEATMAP TOGGLE:
   - A futuristic floating switcher: [Live Positions] | [Thermal Density].
   - When Thermal is active, apply a beautiful blur effect overlay simulating a spatial footfall heatmap (using vibrant indigo-to-orange thermal gradients).
5. ANALYTICS CARD: A compact analytics panel showing "Active Occupancy", "Average Stay", and "Security Correlation Confidence (96.4%)".

Everything must look premium, dark-mode standard, with responsive grid structures.
```

---

## 3. UI/UX Optimization Workflow

To make sure your front-end has the absolute highest visual polish, follow these **rules of thumb**:

1.  **Drop Shadows:** Instead of default shadows, use colored glows for indicators:
    ```css
    box-shadow: 0 0 15px hsla(180, 100%, 50%, 0.35); /* Cyan Laser Glow */
    ```
2.  **Typography:** Always specify a high-end typography layout. Use a monospaced font (like `JetBrains Mono` or `Fira Code`) for system statuses/coordinates, and a clean sans-serif (like `Outfit` or `Inter`) for general titles and telemetry cards.
3.  **Spring Physics:** When adding animations via packages like `Framer Motion` (highly recommended for web) or `Reanimated` (for mobile), use a spring configuration rather than a flat linear delay:
    ```javascript
    // Framer Motion example
    transition={{ type: "spring", stiffness: 120, damping: 14 }}
    ```
