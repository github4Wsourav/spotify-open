# 🎵 Spotify Open (Spotify Free)

> A modern, free, cross-platform Spotify client that runs on **any Phone and Laptop completely free**, featuring real-time music streaming, audio visualizers, playlist management, and offline support. Includes an installable **Android APK** and full **PWA** support.

---

## 📑 Table of Contents
1. [Deep-Dive: How Spotify Works Under the Hood](#-deep-dive-how-spotify-works-under-the-hood)
2. [Spotify Open Features](#-spotify-open-features)
3. [Running on Laptop (Desktop Mode)](#-running-on-laptop)
4. [Running on Phone (Android APK & PWA)](#-running-on-phone)
5. [Keyboard Shortcuts](#-keyboard-shortcuts)
6. [Architecture & Technical Stack](#-architecture--technical-stack)
7. [Building the Android APK](#-building-the-android-apk)

---

## 🔍 Deep-Dive: How Spotify Works Under the Hood

To build an authentic Spotify experience, we analyzed Spotify's official Android application package (`com.spotify.music` v9.1.98.621) and desktop architecture. Here is how Spotify operates at scale:

### 1. Client Architecture
* **Cross-Platform Foundation**:
  * **Desktop**: Chromium Embedded Framework (CEF) host executing a React/Redux/TypeScript SPA, communicating with an embedded C++ core library (`liborbit`) through internal IPC.
  * **Mobile (Android / iOS)**: Hybrid native architecture. On Android, it utilizes **Jetpack Compose** for UI, **AndroidX Media3** (`MediaLibraryService`, `MediaSessionService`), **Room** database for metadata caching, and native C++ JNI libraries (`liborbit-jni-spotify.so`).
  * **Web (open.spotify.com)**: React Single-Page App integrated with the **Web Playback SDK** and Encrypted Media Extensions (EME) with Widevine DRM.

### 2. Audio Engine & Streaming Pipeline
* **Codecs & Bitrates**:
  * Free Tier: HE-AACv2 (96 kbps) on mobile, AAC (128 kbps) or Vorbis on web.
  * Premium: Ogg Vorbis (320 kbps) / AAC (256 kbps) with high-fidelity dynamics.
* **Sub-200ms Playback Start (Chunked Streaming)**:
  * Audio tracks are divided into ~128KB chunks. When a user presses Play, Chunk 0 is fetched immediately with the highest network priority to start playback within **<200 milliseconds**, while subsequent chunks stream adaptively.
* **Audio Signal Processing**:
  * **Loudness Normalization**: Implements ITU-R BS.1770 / ReplayGain standards to normalize volume to -14 LUFS, preventing jarring volume jumps between tracks.
  * **Dual-Buffer Gapless Playback & Crossfade**: Two parallel audio decoders buffer the tail of track $N$ and the head of track $N+1$ to allow seamless, zero-latency transitions.

### 3. Synchronization & Protocols
* **Hermes Protocol**: Spotify's internal binary RPC protocol running over ZeroMQ/Protobuf for low-latency communication with backend microservices.
* **Spirc (Spotify Connect)**: Zero-configuration protocol over mDNS/cloud that synchronizes playback state across phone, laptop, TV, gaming consoles, and smart speakers.

### 4. Recommendation & Discovery Engine
* **Collaborative Filtering**: Analyzes co-occurrence in millions of public and user playlists using implicit feedback matrix factorization.
* **Raw Audio Convolutional Neural Networks (CNNs)**: Analyzes audio spectrograms to understand tempo, rhythm, timbre, acousticness, and valence for new and emerging artists.
* **Exploration vs. Exploitation Bandits**: Personalizes daily mixes and Discover Weekly by blending familiar comfort songs with curated exploratory recommendations.

---

## 🚀 Spotify Open Features

This application implements the core Spotify experience without any subscription fees or audio ads:

* **Dark Modern Spotify UI**:
  * Authentic color palette: Spotify Green (`#1DB954`), Deep Black (`#121212`), surface cards (`#181818`), frosted glass headers.
  * **Dynamic Ambient Palette**: The hero header and Now Playing screen dynamically tint based on the album art of the currently playing track.
* **100% Free Unlimited Audio Streaming**:
  * Powered by the high-speed **Audius Decentralized Network** and royalty-free streaming CDN.
  * Instant search across hundreds of thousands of artists, tracks, and albums.
  * Browse genres: Pop, Hip-Hop, Dance & EDM, Chill & Relax, Rock, Lo-Fi Study, Workout, and Focus.
* **Real-Time Audio Spectrum Visualizer**:
  * Powered by the **Web Audio API** (`AudioContext` and `AnalyserNode`).
  * 3 Visualizer modes:
    1. **Green Frequency Bars** (Dynamic bouncing spectrum)
    2. **Oscillating Soundwave**
    3. **Radial Pulse Ring**
* **Cross-Device Responsive Design**:
  * **Desktop / Laptop View**: Full 3-column Spotify layout (Left Navigation & Library Sidebar, Center Viewport with hero shelves, Right Now Playing Drawer with Queue, Lyrics & Visualizer, Persistent Bottom Player Bar).
  * **Mobile Phone View**: Responsive layout with top greeting, bottom navigation bar, floating mini-player bar, and slide-up **Full-Screen Now Playing View (NPV)** with scrubbable progress bar, lyrics, and touch controls.
* **MediaSession API Support**:
  * Full integration with OS lock screens (Android/iOS lock screen displays album artwork and playback controls).
  * System notification tray playback controls.
  * Laptop hardware media keys (Play/Pause, Next, Prev, Seek).
* **Library & Playlists**:
  * **Liked Songs**: Save favorite songs with one click (persisted in LocalStorage).
  * **Custom Playlists**: Create, rename, edit, and organize custom playlists.
  * **Recently Played**: Automatic history tracking of your last 50 listened tracks.
  * **Local Audio Files Player**: Drag and drop or browse any MP3, WAV, AAC, M4A, OGG, or FLAC files from your computer or phone to play directly inside the app with full visualizer support!

---

## 💻 Running on Laptop

### Quick Local Run:
1. Double-click `index.html` in any web browser (Chrome, Edge, Firefox, Safari, Brave), OR
2. Run a simple local HTTP server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.
4. **Install as Desktop App**: Click the "Install App" pill in the left sidebar or the install icon in your browser address bar.

---

## 📱 Running on Phone

### Option A: Install the Android APK
1. Download **`Spotify-Open.apk`** from this repository.
2. Transfer it to your Android phone (or download directly via mobile browser).
3. Tap the `.apk` file and select **Install** (enable "Install from unknown sources" if prompted).
4. Launch **Spotify Open** from your app drawer!

### Option B: Progressive Web App (PWA)
1. Open the web app link in Chrome (Android) or Safari (iOS).
2. Tap the browser menu (or Share button on iOS) and select **"Add to Home Screen"**.
3. It installs as a standalone fullscreen app with offline caching and lock screen controls!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `Ctrl + Right Arrow` | Next Track |
| `Ctrl + Left Arrow` | Previous Track |
| `Right Arrow` | Seek Forward 5 seconds |
| `Left Arrow` | Seek Backward 5 seconds |
| `Up Arrow` | Volume Up (+5%) |
| `Down Arrow` | Volume Down (-5%) |
| `M` | Mute / Unmute |
| `L` | Like / Unlike Current Track |
| `S` | Toggle Shuffle |
| `R` | Toggle Repeat (Off / All / One) |
| `F` | Toggle Fullscreen Now Playing View |

---

## 🛠️ Architecture & Technical Stack

```
Spotify Open
├── index.html           # Semantic responsive UI (Desktop 3-column + Mobile NPV)
├── style.css            # Spotify Design System, Dark Mode, Animations & Media Queries
├── app.js               # Audio Engine, Audius API, Web Audio Visualizer, Storage & Routing
├── manifest.json        # PWA Web App Manifest
├── sw.js                # Service Worker for offline shell caching
├── build_apk.py         # Automated Android SDK build pipeline
├── Spotify-Open.apk     # Standalone compiled Android APK (signed & aligned)
└── assets/              # High-res Spotify icons (192x192, 512x512) and vector assets
```

---

## 🔨 Building the Android APK

The project includes an automated Python build script `build_apk.py` that utilizes official Android build tools (`aapt2`, `d8`, `zipalign`, and `apksigner`):

```bash
python build_apk.py
```

This compiles `MainActivity.java`, packages all web assets into `/android_asset/`, converts Dalvik bytecode, aligns, and signs `Spotify-Open.apk`.

---

## 📄 License
MIT License. Created for education, portfolio demonstration, and personal music streaming.
