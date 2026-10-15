# CadenceLens Frontend: React 19 + Vite Forensic Station

### Multimodal AI Hackathon 2026 — Track C (IIT Mandi)
**Lead Designer & Architect:** **SynthReaper**

[![Live Web Application (Vercel)](https://img.shields.io/badge/Live%20Frontend-cadence--lens.vercel.app-000000.svg?style=for-the-badge&logo=vercel)](https://cadence-lens.vercel.app/)
[![Connected Backend (Render)](https://img.shields.io/badge/Connected%20Backend-cadencelens.onrender.com-46E3B7.svg?style=for-the-badge&logo=render)](https://cadencelens.onrender.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384.svg?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

Production forensic acoustic station for contrastive speech analytics, word-level forced alignment synchronization, real-time live microphone declamation analysis, and causal flaw explainability.

---

## 🌐 Live Deployments

* **Frontend (Vercel Edge)**: [https://cadence-lens.vercel.app/](https://cadence-lens.vercel.app/)
* **Backend (Render Cloud)**: [https://cadencelens.onrender.com/](https://cadencelens.onrender.com/)
* **Interactive API Docs**: [https://cadencelens.onrender.com/docs](https://cadencelens.onrender.com/docs)

---

## 🎨 Design Philosophy: Tactile Newsprint (Zero AI-Slop)

CadenceLens purposefully rejects the homogenous "AI-slop" aesthetic of blurry purple glowing mesh gradients, generic glassmorphism halos, and template cards. Instead, the interface implements the **AccessLens Tactile Newsprint & Paper Track** design system:

* **Warm Newsprint Canvas**: Background `#fff8f5` paired with subtle dot grids `#e5d8d0` (16px radial repeat) and legal-pad accents `#ffddb6`.
* **Crisp Ink Borders**: Heavy 2px solid dark ink borders (`#1e1b19`) ensuring maximum contrast and legibility.
* **Press Drop-Shadows with Zero Blur**: Authentic physical hard drop-shadows (`box-shadow: 2px 2px 0 #1e1b19`, `3px 3px 0 #1e1b19`, `4px 4px 0 #1e1b19`) paired with responsive click depression (`active:translate-x-0.5 active:translate-y-0.5`).
* **Physical Ephemera**: Corner terracotta pushpins (`#cb4914`), sage green markers (`#37613d`), rotated washi tape labels, and collectible rubber stamps (`rubber-stamp`).
* **Typographic Pairing**: Punchy display titles (Bricolage Grotesque / Plus Jakarta Sans), editorial serif body copy (Newsreader / Georgia), and crisp technical telemetry (Space Mono / JetBrains Mono).

---

## 🧩 Architectural Component Layout

```
frontend/src/
├── components/
│   ├── StudioView.jsx            # A/B Player, Karaoke Sync, Causal Cards & DTW Overlay
│   ├── MicLabView.jsx            # Real-Time Teleprompter, 60 FPS Oscilloscope & Praat Grid
│   ├── BenchmarkView.jsx         # Monotonic Validation Matrix & Praat 2D Vowel Space
│   ├── ResearchPaperView.jsx     # Formal Academic Preprint with KaTeX Equations
│   ├── TimeSeriesChart.jsx       # Chart.js Aligned DTW Feature Visualizer (Pitch, Energy, Rate)
│   ├── Header.jsx                # Tactile Navigation Header with SVG Emblem & Live Links
│   ├── Footer.jsx                # 4-Column Editorial Newsprint Footer & SynthReaper Seal
│   └── Math.jsx                  # KaTeX Mathematical Formulation Component
├── utils/
│   └── audio.js                  # Browser 16-bit PCM WAV Encoder & Native Web Audio DSP
├── data/
│   └── precomputed.json          # Pre-calculated evaluations for 0ms Vercel latency
├── App.jsx                       # Application Root, View Switcher & Error Boundary
├── index.css                     # Tactile Newsprint CSS, Press Shadows & Washi Tape
└── main.jsx                      # React 19 Entrypoint
```

---

## ⚡ Real-Time Client-Side DSP Engine (`src/utils/audio.js`)

To guarantee that the live Vercel demonstration **never fails on stage** even if the remote backend experiences cloud cold starts or latency:

1. **Browser 16-bit Mono PCM WAV Transcoder**:
   - Converts browser-recorded WebM / Opus blobs directly into standard 16-bit 22.05 kHz PCM WAV buffers using native Web Audio `AudioContext`.
   - Eliminates standard cross-browser recording format bugs.

2. **Web Audio DSP Pipeline**:
   - **Autocorrelation Pitch Tracking**: Sub-hertz fundamental frequency ($F_0$) extraction over 75–400 Hz.
   - **Frame-by-Frame RMS Energy**: Peak syllabic onset detection separating voiced vowels from background noise.
   - **Clinical Voice Perturbations**: Period-to-period Local Jitter (%) and amplitude Local Shimmer (%).
   - **Harmonics-to-Noise Ratio (HNR)**: Glottal closure efficiency in decibels.
   - **Dynamic Time Warping (DTW)**: Multidimensional acoustic divergence cost against the JFK baseline.
   - **Strict Duration Coverage Guardrails**: Penalizes truncated recordings ($T_{\text{user}} < 0.65 T_{\text{target}}$) down to Grade F (`F • BOTCHED ORATION`).

---

## 🚀 Local Development & Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### 3. Build Production Bundle
```bash
npm run build
```
Vite compiles the production application into `dist/` in under 600ms.

### 4. Connect to Cloud Backend
Create a `.env.local` file:
```env
VITE_API_URL=https://cadencelens.onrender.com
```

---

<div align="center">
  <b>CadenceLens Frontend</b> • Engineered by <b>SynthReaper</b> • Multimodal AI Hackathon 2026
</div>
