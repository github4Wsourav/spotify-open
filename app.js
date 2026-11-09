/**
 * SPOTIFY OPEN - MAIN APPLICATION ENGINE
 * Audio streaming, Audius decentralized API, Web Audio API Spectrum Visualizer,
 * MediaSession API, Playlist Management, Local Files & Responsive Navigation.
 */

class SpotifyApp {
  constructor() {
    this.audio = document.getElementById('audio-player');
    this.currentTrack = null;
    this.queue = [];
    this.queueIndex = -1;
    this.originalQueue = [];
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'off'; // 'off' | 'all' | 'one'
    this.volume = 0.8;
    this.isMuted = false;
    
    // Web Audio API Visualizer
    this.audioCtx = null;
    this.analyser = null;
    this.audioSource = null;
    this.vizMode = 'bars'; // 'bars' | 'wave' | 'circle'
    this.animFrameId = null;

    // Data Storage
    this.likedSongs = this.loadFromStorage('sp_liked_songs', []);
    this.userPlaylists = this.loadFromStorage('sp_user_playlists', [
      { id: 'fav_hits', name: 'My Top Favorites', desc: 'Best curated tracks', tracks: [] },
      { id: 'chill_mix', name: 'Late Night Chill', desc: 'Relaxing lo-fi & indie vibes', tracks: [] }
    ]);
    this.recentlyPlayed = this.loadFromStorage('sp_recently_played', []);
    this.localFiles = [];

    // Navigation & State
    this.currentView = 'home';
    this.viewHistory = ['home'];
    this.historyIdx = 0;
    this.currentPlaylistContext = null;
    this.audiusHosts = ['https://api.audius.co', 'https://audius-discovery-1.cultur3stake.com', 'https://discoveryprovider.audius.co'];
    this.activeAudiusHost = 'https://api.audius.co';
    this.activeDrawerTab = 'npv';

    // Curated Starter Tracks (Instant play with zero lag)
    this.curatedTracks = [
      {
        id: 'curated_1',
        title: 'Starboy (Synthwave Remix)',
        artist: 'The Weeknd & Daft Punk',
        album: 'Starboy Extended',
        artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        duration: 147,
        genre: 'Electronic',
        color: '#381648'
      },
      {
        id: 'curated_2',
        title: 'Midnight City Lights',
        artist: 'M83 Tribute Synth',
        album: 'Neon Dreams',
        artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
        duration: 154,
        genre: 'Electronic',
        color: '#1c3456'
      },
      {
        id: 'curated_3',
        title: 'Chill Lo-Fi Study Beats',
        artist: 'Komorebi Sound',
        album: 'Coffee & Books',
        artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
        duration: 132,
        genre: 'Chill',
        color: '#4a2f1b'
      },
      {
        id: 'curated_4',
        title: 'Heat Waves (Acoustic Ambient)',
        artist: 'Glass Animals Vibes',
        album: 'Dreamland Sessions',
        artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=tuesday-glitch-future-bass-124479.mp3',
        duration: 160,
        genre: 'Pop',
        color: '#164835'
      },
      {
        id: 'curated_5',
        title: 'Cyberpunk Tokyo Drift',
        artist: 'Neo Shinjuku',
        album: '2099 Nightclub',
        artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=cyberpunk-beat-118127.mp3',
        duration: 185,
        genre: 'Electronic',
        color: '#52142d'
      },
      {
        id: 'curated_6',
        title: 'Golden Hour Guitar',
        artist: 'Sunset Horizons',
        album: 'Summer Acoustic',
        artwork: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop',
        streamUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=guitar-electro-sport-trailer-11559.mp3',
        duration: 142,
        genre: 'Rock',
        color: '#543b12'
      }
    ];

    // Categories
    this.categories = [
      { id: 'pop', name: 'Pop Hits', color: '#8d67ab', icon: 'fa-music' },
      { id: 'hiphop', name: 'Hip-Hop / Rap', color: '#ba5d07', icon: 'fa-fire' },
      { id: 'electronic', name: 'Dance & EDM', color: '#148a08', icon: 'fa-bolt' },
      { id: 'chill', name: 'Chill & Relax', color: '#503750', icon: 'fa-couch' },
      { id: 'rock', name: 'Rock Classics', color: '#e91429', icon: 'fa-guitar' },
      { id: 'lofi', name: 'Lo-Fi Study', color: '#d84000', icon: 'fa-headphones' },
      { id: 'workout', name: 'Workout Power', color: '#777777', icon: 'fa-dumbbell' },
      { id: 'focus', name: 'Deep Focus', color: '#509bf5', icon: 'fa-brain' }
    ];

    this.init();
  }

  async init() {
    this.setupAudioListeners();
    this.setupUIEventListeners();
    this.setupKeyboardShortcuts();
    this.setupMediaSession();
    this.setupDragAndDrop();
    this.renderSidebarPlaylists();
    this.renderHomeShelves();
    this.renderCategories();
    this.updateGreeting();
    this.initAudiusNetwork();

    // Default to the first curated track
    this.queue = [...this.curatedTracks];
    this.originalQueue = [...this.curatedTracks];
    this.setTrack(this.curatedTracks[0], false);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(console.warn);
    }
  }

  /* ==========================================================================
     AUDIO PIPELINE & WEB AUDIO SPECTRUM VISUALIZER
     ========================================================================== */
  initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins
      this.analyser.smoothingTimeConstant = 0.8;

      this.audioSource = this.audioCtx.createMediaElementSource(this.audio);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.startVisualizerLoop();
    } catch (e) {
      console.warn('Web Audio API initialized in fallback mode:', e);
    }
  }

  startVisualizerLoop() {
    const drawerCanvas = document.getElementById('drawer-canvas');
    const largeCanvas = document.getElementById('large-visualizer-canvas');
    const npvCanvas = document.getElementById('npv-canvas');
    const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      this.animFrameId = requestAnimationFrame(render);
      if (!this.analyser || !this.isPlaying) {
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      // Render on all active canvases
      if (drawerCanvas && drawerCanvas.offsetParent !== null) {
        this.drawBars(drawerCanvas, dataArray, bufferLength, '#1db954');
      }
      if (largeCanvas && largeCanvas.offsetParent !== null) {
        if (this.vizMode === 'wave') {
          this.drawWave(largeCanvas, dataArray, bufferLength);
        } else if (this.vizMode === 'circle') {
          this.drawRadial(largeCanvas, dataArray, bufferLength);
        } else {
          this.drawBars(largeCanvas, dataArray, bufferLength, '#1ed760');
        }
      }
      if (npvCanvas && npvCanvas.offsetParent !== null) {
        this.drawBars(npvCanvas, dataArray, bufferLength, 'rgba(29, 185, 84, 0.7)');
      }
    };

    render();
  }

  drawBars(canvas, dataArray, count, barColor) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / count) * 1.5;
    let x = 0;

    for (let i = 0; i < count; i++) {
      const val = dataArray[i];
      const barHeight = (val / 255) * height * 0.9 + 2;

      // Gradient color for bars
      const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
      grad.addColorStop(0, barColor);
      grad.addColorStop(1, '#ffffff');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, Math.max(barWidth - 2, 2), barHeight, [2, 2, 0, 0]);
      ctx.fill();

      x += barWidth;
    }
  }

  drawWave(canvas, dataArray, count) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 3;

    const sliceWidth = width / count;
    let x = 0;

    for (let i = 0; i < count; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  drawRadial(canvas, dataArray, count) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 40;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(29, 185, 84, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      const rad = (i * 2 * Math.PI) / count;
      const barLen = (dataArray[i] / 255) * 45;
      const x1 = centerX + Math.cos(rad) * radius;
      const y1 = centerY + Math.sin(rad) * radius;
      const x2 = centerX + Math.cos(rad) * (radius + barLen);
      const y2 = centerY + Math.sin(rad) * (radius + barLen);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#1db954';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  setVizMode(mode) {
    this.vizMode = mode;
    document.querySelectorAll('.viz-mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }

  /* ==========================================================================
     AUDIO PLAYBACK CONTROLS
     ========================================================================== */
  setupAudioListeners() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayStateUI();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayStateUI();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgressUI();
    });

    this.audio.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.playNext();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio stream error, attempting fallback:', e);
      this.showToast('Connecting audio stream...');
    });
  }

  async playTrack(track, queueList = null) {
    if (queueList && queueList.length > 0) {
      this.queue = [...queueList];
      this.originalQueue = [...queueList];
      this.queueIndex = this.queue.findIndex(t => t.id === track.id);
      if (this.queueIndex === -1) {
        this.queue.unshift(track);
        this.queueIndex = 0;
      }
    }

    this.setTrack(track, true);
  }

  setTrack(track, autoPlay = true) {
    this.currentTrack = track;
    this.audio.src = track.streamUrl;

    // Record in recently played
    this.recordRecentlyPlayed(track);

    // Update UI
    this.updateTrackMetaUI(track);

    // Dynamic background ambient color
    this.applyDynamicGradients(track.color || '#244131');

    if (autoPlay) {
      this.initAudioContext();
      this.audio.play().catch(err => {
        console.warn('Autoplay prevented:', err);
      });
    }

    this.updateQueueDrawer();
    this.updateLyricsDrawer();
  }

  togglePlayPause(e) {
    if (e) e.stopPropagation();
    this.initAudioContext();
    if (this.audio.paused) {
      this.audio.play().catch(console.warn);
    } else {
      this.audio.pause();
    }
  }

  playNext() {
    if (this.queue.length === 0) return;
    let nextIdx = this.queueIndex + 1;
    if (nextIdx >= this.queue.length) {
      if (this.repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return; // End of queue
      }
    }
    this.queueIndex = nextIdx;
    this.setTrack(this.queue[this.queueIndex], true);
  }

  playPrevious() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    if (this.queue.length === 0) return;
    let prevIdx = this.queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = this.queue.length - 1;
    }
    this.queueIndex = prevIdx;
    this.setTrack(this.queue[this.queueIndex], true);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    const btn = document.getElementById('ctrl-shuffle');
    const npvBtn = document.getElementById('npv-ctrl-shuffle');
    btn.classList.toggle('active', this.isShuffle);
    if (npvBtn) npvBtn.classList.toggle('active', this.isShuffle);

    if (this.isShuffle) {
      // Fisher-Yates shuffle remaining queue
      const current = this.queue[this.queueIndex];
      let remaining = this.queue.filter(t => t.id !== current.id);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      this.queue = [current, ...remaining];
      this.queueIndex = 0;
      this.showToast('Shuffle ON');
    } else {
      this.queue = [...this.originalQueue];
      this.queueIndex = this.queue.findIndex(t => t.id === this.currentTrack.id);
      this.showToast('Shuffle OFF');
    }
    this.updateQueueDrawer();
  }

  toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const idx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];

    const btn = document.getElementById('ctrl-repeat');
    const npvBtn = document.getElementById('npv-ctrl-repeat');
    btn.classList.toggle('active', this.repeatMode !== 'off');
    if (npvBtn) npvBtn.classList.toggle('active', this.repeatMode !== 'off');

    if (this.repeatMode === 'one') {
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i><span style="font-size: 0.6rem; position: absolute; top: 2px; right: 2px;">1</span>';
      this.showToast('Repeat Current Song');
    } else if (this.repeatMode === 'all') {
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
      this.showToast('Repeat All');
    } else {
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
      this.showToast('Repeat OFF');
    }
  }

  seek(percentage) {
    if (!this.audio.duration) return;
    this.audio.currentTime = percentage * this.audio.duration;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.audio.volume = this.isMuted ? 0 : this.volume;
    const fill = document.getElementById('volume-bar-fill');
    if (fill) fill.style.width = `${this.volume * 100}%`;
    this.updateVolumeIcon();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    const icon = document.getElementById('vol-icon');
    if (!icon) return;
    if (this.isMuted || this.audio.volume === 0) {
      icon.className = 'fa-solid fa-volume-xmark';
    } else if (this.audio.volume < 0.5) {
      icon.className = 'fa-solid fa-volume-low';
    } else {
      icon.className = 'fa-solid fa-volume-high';
    }
  }

  /* ==========================================================================
     UI METADATA & PROGRESS UPDATES
     ========================================================================== */
  updateTrackMetaUI(track) {
    // Desktop Player Bar
    document.getElementById('player-track-name').textContent = track.title;
    document.getElementById('player-artist-name').textContent = track.artist;
    document.getElementById('player-art').src = track.artwork;

    // Mobile Mini-Player
    document.getElementById('mini-title').textContent = track.title;
    document.getElementById('mini-artist').textContent = track.artist;
    document.getElementById('mini-art').src = track.artwork;

    // Mobile Full NPV
    document.getElementById('npv-track-title').textContent = track.title;
    document.getElementById('npv-artist-name').textContent = track.artist;
    document.getElementById('npv-cover-img').src = track.artwork;

    // Right Drawer NPV
    document.getElementById('drawer-track-title').textContent = track.title;
    document.getElementById('drawer-track-artist').textContent = track.artist;
    document.getElementById('drawer-track-art').src = track.artwork;
    document.getElementById('drawer-credit-artist').textContent = track.artist;

    // Update heart liked state
    this.updateLikedButtonUI(track.id);

    // Update MediaSession
    this.updateMediaSessionMetadata(track);
  }

  updatePlayStateUI() {
    const playIcon = document.getElementById('play-pause-icon');
    const miniIcon = document.getElementById('mini-play-icon');
    const npvIcon = document.getElementById('npv-play-icon');

    const iconClass = this.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    if (playIcon) playIcon.className = iconClass;
    if (miniIcon) miniIcon.className = iconClass;
    if (npvIcon) npvIcon.className = iconClass;

    // Highlight row in active playlist table
    document.querySelectorAll('.track-row').forEach(row => {
      const isCurrent = row.dataset.trackId === (this.currentTrack ? this.currentTrack.id : null);
      row.classList.toggle('playing', isCurrent);
    });
  }

  updateProgressUI() {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;

    // Timestamps
    const curText = this.formatTime(cur);
    const durText = this.formatTime(dur);

    // Desktop
    document.getElementById('time-current').textContent = curText;
    document.getElementById('time-total').textContent = durText;
    document.getElementById('progress-bar-fill').style.width = `${pct}%`;
    document.getElementById('progress-bar-handle').style.left = `${pct}%`;

    // Mobile mini bar
    document.getElementById('mini-player-progress').style.width = `${pct}%`;

    // Mobile NPV
    const npvFill = document.getElementById('npv-progress-bar-fill');
    if (npvFill) npvFill.style.width = `${pct}%`;
    document.getElementById('npv-time-current').textContent = curText;
    document.getElementById('npv-time-total').textContent = durText;
  }

  formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  applyDynamicGradients(colorHex) {
    const grad = document.getElementById('dynamic-gradient');
    const npvModal = document.getElementById('mobile-npv-modal');
    if (grad) {
      grad.style.background = `linear-gradient(180deg, ${colorHex} 0%, #121212 100%)`;
    }
    if (npvModal) {
      npvModal.style.background = `linear-gradient(180deg, ${colorHex} 0%, #121212 60%)`;
    }
  }

  /* ==========================================================================
     MEDIA SESSION API (Lock screen, notifications, laptop media keys)
     ========================================================================== */
  setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && this.audio.duration) {
        this.audio.currentTime = details.seekTime;
      }
    });
  }

  updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Spotify Free',
      artwork: [
        { src: track.artwork, sizes: '96x96', type: 'image/png' },
        { src: track.artwork, sizes: '192x192', type: 'image/png' },
        { src: track.artwork, sizes: '512x512', type: 'image/png' }
      ]
    });
  }

  /* ==========================================================================
     KEYBOARD SHORTCUTS (Laptop / Desktop)
     ========================================================================== */
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey) this.playPrevious();
          else this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey) this.playNext();
          else this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setVolume(this.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setVolume(this.volume - 0.05);
          break;
        case 'KeyM':
          this.toggleMute();
          break;
        case 'KeyL':
          this.toggleLikeCurrent();
          break;
        case 'KeyS':
          this.toggleShuffle();
          break;
        case 'KeyR':
          this.toggleRepeat();
          break;
        case 'KeyF':
          this.toggleFullScreenNPV();
          break;
      }
    });
  }

  /* ==========================================================================
     AUDIUS DECENTRALIZED MUSIC API (100% Free, Global, No Rate Limit)
     ========================================================================== */
  async initAudiusNetwork() {
    try {
      const resp = await fetch('https://api.audius.co');
      const data = await resp.json();
      if (data.data && data.data.length > 0) {
        this.audiusHosts = data.data;
        this.activeAudiusHost = this.audiusHosts[0];
      }
    } catch (e) {
      console.warn('Using default Audius host:', this.activeAudiusHost);
    }

    // Fetch live trending tracks
    this.fetchAudiusTrending();
    this.fetchAudiusGenres();
  }

  async fetchAudiusTrending() {
    try {
      const url = `${this.activeAudiusHost}/v1/tracks/trending?limit=12&app_name=SPOTIFY_FREE`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const trendingTracks = json.data.map(t => this.formatAudiusTrack(t));
        this.renderShelf('shelf-trending', trendingTracks);
        this.renderQuickPicks(trendingTracks.slice(0, 6));
      }
    } catch (e) {
      console.warn('Failed to load trending tracks:', e);
    }
  }

  async fetchAudiusGenres() {
    try {
      const electronicUrl = `${this.activeAudiusHost}/v1/tracks/trending?genre=Electronic&limit=6&app_name=SPOTIFY_FREE`;
      const chillUrl = `${this.activeAudiusHost}/v1/tracks/trending?genre=Chill&limit=6&app_name=SPOTIFY_FREE`;

      const [resEl, resCh] = await Promise.all([fetch(electronicUrl), fetch(chillUrl)]);
      const [jsonEl, jsonCh] = await Promise.all([resEl.json(), resCh.json()]);

      if (jsonEl.data) {
        this.renderShelf('shelf-electronic', jsonEl.data.map(t => this.formatAudiusTrack(t)));
      }
      if (jsonCh.data) {
        this.renderShelf('shelf-chill', jsonCh.data.map(t => this.formatAudiusTrack(t)));
      }
    } catch (e) {
      console.warn('Failed to load genre shelves:', e);
    }
  }

  formatAudiusTrack(t) {
    const artwork = (t.artwork && t.artwork['480x480']) || 
                    (t.artwork && t.artwork['150x150']) || 
                    'assets/icon-512.png';
    const streamUrl = `${this.activeAudiusHost}/v1/tracks/${t.id}/stream?app_name=SPOTIFY_FREE`;

    // Dynamic color based on title hash
    const colors = ['#244131', '#1e3264', '#532b6e', '#8400e7', '#8c1932', '#ba5d07', '#335042'];
    const color = colors[Math.abs(t.title.length) % colors.length];

    return {
      id: `audius_${t.id}`,
      title: t.title,
      artist: t.user ? t.user.name : 'Unknown Artist',
      album: t.genre || 'Trending on Audius',
      artwork: artwork,
      streamUrl: streamUrl,
      duration: t.duration || 180,
      genre: t.genre || 'Music',
      color: color
    };
  }

  async performSearch(query) {
    if (!query || !query.trim()) {
      document.getElementById('search-results-container').style.display = 'none';
      document.getElementById('browse-categories-wrapper').style.display = 'block';
      document.getElementById('search-filter-chips').style.display = 'none';
      return;
    }

    document.getElementById('browse-categories-wrapper').style.display = 'none';
    document.getElementById('search-results-container').style.display = 'block';
    document.getElementById('search-filter-chips').style.display = 'flex';

    // Search local + curated tracks first
    const cleanQ = query.toLowerCase();
    const localMatches = [...this.curatedTracks, ...this.localFiles].filter(
      t => t.title.toLowerCase().includes(cleanQ) || t.artist.toLowerCase().includes(cleanQ)
    );

    // Search Audius
    try {
      const url = `${this.activeAudiusHost}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=15&app_name=SPOTIFY_FREE`;
      const res = await fetch(url);
      const json = await res.json();
      const audiusMatches = (json.data || []).map(t => this.formatAudiusTrack(t));

      const combined = [...localMatches, ...audiusMatches];
      this.renderSearchResults(combined);
    } catch (e) {
      this.renderSearchResults(localMatches);
    }
  }

  renderSearchResults(tracks) {
    const list = document.getElementById('search-tracks-list');
    list.innerHTML = '';

    if (tracks.length === 0) {
      list.innerHTML = '<p style="color: var(--sp-text-sub); padding: 20px;">No matching songs found. Try another search term!</p>';
      return;
    }

    tracks.forEach((track, i) => {
      const row = document.createElement('div');
      row.className = 'search-track-row';
      row.innerHTML = `
        <img src="${track.artwork}" alt="Art" class="track-row-art">
        <div class="track-row-info">
          <div class="track-row-name">${track.title}</div>
          <div class="track-row-artist">${track.artist}</div>
        </div>
        <div class="track-row-duration">${this.formatTime(track.duration)}</div>
        <button class="heart-btn" onclick="event.stopPropagation(); app.toggleLikeTrack('${track.id}')">
          <i class="${this.isLiked(track.id) ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart'}"></i>
        </button>
      `;
      row.onclick = () => this.playTrack(track, tracks);
      list.appendChild(row);
    });
  }

  /* ==========================================================================
     SHELVES, QUICK PICKS & CATEGORIES
     ========================================================================== */
  renderHomeShelves() {
    this.renderShelf('shelf-recommended', this.curatedTracks);
    this.renderArtistsShelf();
  }

  renderShelf(containerId, tracks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    tracks.forEach(track => {
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${track.artwork}" alt="${track.title}" class="card-cover" loading="lazy">
          <button class="card-play-btn" title="Play">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
        <div class="card-title">${track.title}</div>
        <div class="card-desc">${track.artist}</div>
      `;
      card.onclick = () => this.playTrack(track, tracks);
      container.appendChild(card);
    });
  }

  renderQuickPicks(tracks) {
    const grid = document.getElementById('quick-picks-grid');
    if (!grid) return;
    grid.innerHTML = '';

    tracks.forEach(track => {
      const card = document.createElement('div');
      card.className = 'quick-pick-card';
      card.innerHTML = `
        <img src="${track.artwork}" alt="${track.title}" class="quick-pick-img">
        <span class="quick-pick-title">${track.title}</span>
        <button class="card-play-btn" title="Play">
          <i class="fa-solid fa-play"></i>
        </button>
      `;
      card.onclick = () => this.playTrack(track, tracks);
      grid.appendChild(card);
    });
  }

  renderArtistsShelf() {
    const artists = [
      { name: 'The Weeknd', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop', genre: 'Artist' },
      { name: 'Daft Punk', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop', genre: 'Artist' },
      { name: 'Billie Eilish', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop', genre: 'Artist' },
      { name: 'Coldplay', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop', genre: 'Artist' },
      { name: 'Skrillex', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop', genre: 'Artist' }
    ];

    const container = document.getElementById('shelf-artists');
    if (!container) return;
    container.innerHTML = '';

    artists.forEach(a => {
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${a.img}" alt="${a.name}" class="card-cover">
          <button class="card-play-btn" title="Play"><i class="fa-solid fa-play"></i></button>
        </div>
        <div class="card-title">${a.name}</div>
        <div class="card-desc">${a.genre}</div>
      `;
      card.onclick = () => {
        this.navigate('search');
        document.getElementById('global-search-input').value = a.name;
        this.performSearch(a.name);
      };
      container.appendChild(card);
    });
  }

  renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.categories.forEach(c => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.backgroundColor = c.color;
      card.innerHTML = `
        <h3>${c.name}</h3>
        <i class="fa-solid ${c.icon} category-icon"></i>
      `;
      card.onclick = () => {
        this.navigate('search');
        document.getElementById('global-search-input').value = c.name;
        this.performSearch(c.id);
      };
      grid.appendChild(card);
    });
  }

  /* ==========================================================================
     PLAYLIST & LIBRARY SYSTEM
     ========================================================================== */
  renderSidebarPlaylists() {
    const list = document.getElementById('sidebar-playlists');
    if (!list) return;
    list.innerHTML = '';

    this.userPlaylists.forEach(pl => {
      const link = document.createElement('div');
      link.className = 'playlist-nav-link';
      link.textContent = pl.name;
      link.onclick = () => this.openPlaylist(pl);
      list.appendChild(link);
    });
  }

  openPlaylist(playlist) {
    this.currentPlaylistContext = playlist;
    this.navigate('playlist');

    document.getElementById('playlist-type').textContent = 'PLAYLIST';
    document.getElementById('playlist-hero-title').textContent = playlist.name;
    document.getElementById('playlist-hero-desc').textContent = playlist.desc || 'Custom user playlist';
    document.getElementById('playlist-track-count').textContent = `${playlist.tracks.length} songs`;
    document.getElementById('playlist-action-delete').style.display = playlist.id.startsWith('custom_') ? 'block' : 'none';

    this.renderTracksTable(playlist.tracks);
  }

  openLikedSongs() {
    this.currentPlaylistContext = {
      id: 'liked_songs',
      name: 'Liked Songs',
      desc: 'All the songs you have saved',
      tracks: this.likedSongs
    };
    this.openPlaylist(this.currentPlaylistContext);
    document.getElementById('playlist-hero-img').src = 'assets/icon-512.png';
  }

  openLocalFiles() {
    this.navigate('local-files');
    this.renderLocalFilesList();
  }

  renderTracksTable(tracks) {
    const body = document.getElementById('playlist-tracks-body');
    if (!body) return;
    body.innerHTML = '';

    if (!tracks || tracks.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: var(--sp-text-sub);">
          <i class="fa-solid fa-music" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>No songs here yet. Explore and like songs to add them!</p>
        </div>
      `;
      return;
    }

    tracks.forEach((track, i) => {
      const row = document.createElement('div');
      const isCur = this.currentTrack && this.currentTrack.id === track.id;
      row.className = `track-row ${isCur ? 'playing' : ''}`;
      row.dataset.trackId = track.id;
      row.innerHTML = `
        <div class="track-num">${i + 1}</div>
        <div class="track-row-play-icon"><i class="fa-solid fa-play"></i></div>
        <div class="track-title-col">
          <img src="${track.artwork}" alt="Cover" class="track-thumb">
          <div class="track-names-box">
            <div class="track-main-name">${track.title}</div>
            <div class="track-artist-name">${track.artist}</div>
          </div>
        </div>
        <div class="track-album-col">${track.album || 'Single'}</div>
        <div class="track-date-col">Recently</div>
        <div class="track-duration-col">
          <button class="heart-btn" onclick="event.stopPropagation(); app.toggleLikeTrack('${track.id}')">
            <i class="${this.isLiked(track.id) ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart'}"></i>
          </button>
          <span>${this.formatTime(track.duration)}</span>
        </div>
      `;
      row.onclick = () => this.playTrack(track, tracks);
      body.appendChild(row);
    });
  }

  playCurrentPlaylist() {
    if (!this.currentPlaylistContext || !this.currentPlaylistContext.tracks.length) {
      this.showToast('Playlist is empty');
      return;
    }
    this.playTrack(this.currentPlaylistContext.tracks[0], this.currentPlaylistContext.tracks);
  }

  shuffleAndPlayCurrentPlaylist() {
    if (!this.currentPlaylistContext || !this.currentPlaylistContext.tracks.length) return;
    this.isShuffle = true;
    const tracks = [...this.currentPlaylistContext.tracks];
    const randIdx = Math.floor(Math.random() * tracks.length);
    this.playTrack(tracks[randIdx], tracks);
    this.toggleShuffle();
  }

  /* ==========================================================================
     LIKED SONGS & STORAGE
     ========================================================================== */
  isLiked(trackId) {
    return this.likedSongs.some(t => t.id === trackId);
  }

  toggleLikeCurrent(e) {
    if (e) e.stopPropagation();
    if (!this.currentTrack) return;
    this.toggleLikeTrack(this.currentTrack.id);
  }

  toggleLikeTrack(trackId) {
    const idx = this.likedSongs.findIndex(t => t.id === trackId);
    if (idx !== -1) {
      this.likedSongs.splice(idx, 1);
      this.showToast('Removed from Liked Songs');
    } else {
      let targetTrack = [this.currentTrack, ...this.curatedTracks, ...this.queue, ...this.localFiles].find(t => t && t.id === trackId);
      if (targetTrack) {
        this.likedSongs.unshift(targetTrack);
        this.showToast('Added to Liked Songs');
      }
    }

    this.saveToStorage('sp_liked_songs', this.likedSongs);
    this.updateLikedButtonUI(trackId);
    if (this.currentPlaylistContext && this.currentPlaylistContext.id === 'liked_songs') {
      this.renderTracksTable(this.likedSongs);
    }
  }

  updateLikedButtonUI(trackId) {
    const liked = this.isLiked(trackId);
    const cls = liked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart';

    const playerBtn = document.getElementById('player-heart-btn');
    const miniBtn = document.getElementById('mini-heart-btn');
    const npvBtn = document.getElementById('npv-heart-btn');
    const drawerBtn = document.getElementById('drawer-heart-btn');

    if (playerBtn) playerBtn.innerHTML = `<i class="${cls}"></i>`;
    if (miniBtn) miniBtn.innerHTML = `<i class="${cls}"></i>`;
    if (npvBtn) npvBtn.innerHTML = `<i class="${cls}"></i>`;
    if (drawerBtn) drawerBtn.innerHTML = `<i class="${cls}"></i>`;
  }

  /* ==========================================================================
     PLAYLIST MODAL & CREATION
     ========================================================================== */
  showCreatePlaylistModal() {
    document.getElementById('create-playlist-modal').style.display = 'flex';
    document.getElementById('new-playlist-name').focus();
  }

  hideCreatePlaylistModal() {
    document.getElementById('create-playlist-modal').style.display = 'none';
  }

  createNewPlaylist() {
    const nameInput = document.getElementById('new-playlist-name');
    const descInput = document.getElementById('new-playlist-desc');
    const name = nameInput.value.trim() || `My Playlist #${this.userPlaylists.length + 1}`;
    const desc = descInput.value.trim() || '';

    const newPl = {
      id: `custom_${Date.now()}`,
      name: name,
      desc: desc,
      tracks: []
    };

    this.userPlaylists.push(newPl);
    this.saveToStorage('sp_user_playlists', this.userPlaylists);
    this.renderSidebarPlaylists();
    this.hideCreatePlaylistModal();
    nameInput.value = '';
    descInput.value = '';

    this.openPlaylist(newPl);
    this.showToast(`Created playlist "${name}"`);
  }

  deleteCurrentPlaylist() {
    if (!this.currentPlaylistContext || !this.currentPlaylistContext.id.startsWith('custom_')) return;
    if (confirm(`Delete playlist "${this.currentPlaylistContext.name}"?`)) {
      this.userPlaylists = this.userPlaylists.filter(p => p.id !== this.currentPlaylistContext.id);
      this.saveToStorage('sp_user_playlists', this.userPlaylists);
      this.renderSidebarPlaylists();
      this.navigate('library');
      this.showToast('Playlist deleted');
    }
  }

  /* ==========================================================================
     LOCAL FILES IMPORT (Drag & drop or file picker)
     ========================================================================== */
  setupDragAndDrop() {
    const fileInput = document.getElementById('local-audio-input');
    const dropzone = document.getElementById('upload-dropzone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleLocalFiles(e.target.files);
      });
    }

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleLocalFiles(e.dataTransfer.files);
      }
    });
  }

  handleLocalFiles(fileList) {
    let added = 0;
    for (let file of fileList) {
      if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)) {
        const fileUrl = URL.createObjectURL(file);
        const nameClean = file.name.replace(/\.[^/.]+$/, '');
        const track = {
          id: `local_${Date.now()}_${Math.random()}`,
          title: nameClean,
          artist: 'Local Device File',
          album: 'Local Audio',
          artwork: 'assets/icon-512.png',
          streamUrl: fileUrl,
          duration: 180,
          genre: 'Local',
          color: '#ff5722'
        };
        this.localFiles.unshift(track);
        added++;
      }
    }

    if (added > 0) {
      this.showToast(`Imported ${added} local audio file(s)!`);
      this.openLocalFiles();
      if (this.localFiles.length === added) {
        this.playTrack(this.localFiles[0], this.localFiles);
      }
    }
  }

  renderLocalFilesList() {
    const container = document.getElementById('local-files-list');
    if (!container) return;
    container.innerHTML = '';

    if (this.localFiles.length === 0) return;

    this.localFiles.forEach(track => {
      const row = document.createElement('div');
      row.className = 'search-track-row';
      row.innerHTML = `
        <img src="${track.artwork}" alt="Cover" class="track-row-art">
        <div class="track-row-info">
          <div class="track-row-name">${track.title}</div>
          <div class="track-row-artist">${track.artist}</div>
        </div>
        <button class="card-play-btn" style="position: static; opacity: 1; transform: none; margin-left: auto;">
          <i class="fa-solid fa-play"></i>
        </button>
      `;
      row.onclick = () => this.playTrack(track, this.localFiles);
      container.appendChild(row);
    });
  }

  /* ==========================================================================
     RIGHT DRAWER: QUEUE, LYRICS & VISUALIZER
     ========================================================================== */
  toggleRightDrawer(tabName = 'npv') {
    const appContainer = document.getElementById('app-container');
    const isClosed = appContainer.classList.contains('drawer-closed');

    if (isClosed) {
      appContainer.classList.remove('drawer-closed');
      this.setDrawerTab(tabName);
    } else if (this.activeDrawerTab === tabName) {
      appContainer.classList.add('drawer-closed');
    } else {
      this.setDrawerTab(tabName);
    }
  }

  closeRightDrawer() {
    document.getElementById('app-container').classList.add('drawer-closed');
  }

  setDrawerTab(tabName) {
    this.activeDrawerTab = tabName;
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.drawer-content').forEach(c => c.classList.remove('active'));

    const tabBtn = document.getElementById(`tab-${tabName}`);
    const content = document.getElementById(`drawer-content-${tabName}`);
    if (tabBtn) tabBtn.classList.add('active');
    if (content) content.classList.add('active');

    if (tabName === 'queue') this.updateQueueDrawer();
    if (tabName === 'lyrics') this.updateLyricsDrawer();
  }

  updateQueueDrawer() {
    const currentItem = document.getElementById('queue-current-item');
    const queueList = document.getElementById('queue-list');
    if (!currentItem || !queueList) return;

    if (this.currentTrack) {
      currentItem.innerHTML = `
        <img src="${this.currentTrack.artwork}" alt="Art" class="queue-thumb">
        <div class="queue-meta">
          <div class="queue-title">${this.currentTrack.title}</div>
          <div class="queue-artist">${this.currentTrack.artist}</div>
        </div>
        <i class="fa-solid fa-volume-high" style="color: var(--sp-green); font-size: 0.85rem;"></i>
      `;
    }

    queueList.innerHTML = '';
    const nextTracks = this.queue.slice(this.queueIndex + 1);
    if (nextTracks.length === 0) {
      queueList.innerHTML = '<p style="color: var(--sp-text-sub); font-size: 0.8rem; padding: 8px;">No songs in queue.</p>';
      return;
    }

    nextTracks.forEach((track, i) => {
      const item = document.createElement('div');
      item.className = 'queue-item';
      item.innerHTML = `
        <span style="font-size: 0.75rem; color: var(--sp-text-sub);">${i + 1}</span>
        <img src="${track.artwork}" alt="Art" class="queue-thumb">
        <div class="queue-meta">
          <div class="queue-title">${track.title}</div>
          <div class="queue-artist">${track.artist}</div>
        </div>
      `;
      item.onclick = () => {
        this.queueIndex = this.queueIndex + 1 + i;
        this.setTrack(track, true);
      };
      queueList.appendChild(item);
    });
  }

  clearQueue() {
    if (!this.currentTrack) return;
    this.queue = [this.currentTrack];
    this.queueIndex = 0;
    this.updateQueueDrawer();
    this.showToast('Queue cleared');
  }

  updateLyricsDrawer() {
    const box = document.getElementById('lyrics-scroll-box');
    if (!box) return;

    if (!this.currentTrack) {
      box.innerHTML = '<p class="lyrics-line">No track playing</p>';
      return;
    }

    // Generated synced aesthetic lyrics for tracks
    const sampleLyrics = [
      `I've been on the low, I been taking my time`,
      `I feel like I'm out of my mind`,
      `It feel like my life ain't even mine`,
      `Who can relate? Woo!`,
      `I just wanna feel like I'm okay`,
      `Every single night and every day`,
      `Listening to the music through the rain`,
      `Turn the volume up and wash away the pain`,
      `Yeah, dancing under neon lights`,
      `Everything will be alright tonight`
    ];

    box.innerHTML = sampleLyrics.map((l, i) => 
      `<div class="lyrics-line ${i === 2 ? 'active' : ''}">${l}</div>`
    ).join('');
  }

  /* ==========================================================================
     MOBILE NOW PLAYING VIEW (NPV)
     ========================================================================== */
  openMobileNPV() {
    const modal = document.getElementById('mobile-npv-modal');
    if (modal) modal.classList.add('open');
  }

  closeMobileNPV() {
    const modal = document.getElementById('mobile-npv-modal');
    if (modal) modal.classList.remove('open');
  }

  toggleFullScreenNPV() {
    const modal = document.getElementById('mobile-npv-modal');
    if (modal.classList.contains('open')) {
      this.closeMobileNPV();
    } else {
      this.openMobileNPV();
    }
  }

  openMobileLyrics() {
    this.toggleRightDrawer('lyrics');
    this.closeMobileNPV();
  }

  openMobileQueue() {
    this.toggleRightDrawer('queue');
    this.closeMobileNPV();
  }

  /* ==========================================================================
     NAVIGATION & VIEW ROUTING
     ========================================================================== */
  navigate(viewName) {
    if (this.currentView === viewName) return;
    this.currentView = viewName;
    this.viewHistory.push(viewName);
    this.historyIdx = this.viewHistory.length - 1;

    // Switch view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    // Update active nav buttons
    ['home', 'search', 'library'].forEach(n => {
      const desktopNav = document.getElementById(`nav-${n}`);
      const mobileNav = document.getElementById(`mob-nav-${n}`);
      if (desktopNav) desktopNav.classList.toggle('active', n === viewName);
      if (mobileNav) mobileNav.classList.toggle('active', n === viewName);
    });

    // Reset scroll position
    document.getElementById('main-scroll-content').scrollTop = 0;
  }

  historyBack() {
    if (this.historyIdx > 0) {
      this.historyIdx--;
      const target = this.viewHistory[this.historyIdx];
      this.currentView = target;
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`view-${target}`).classList.add('active');
    }
  }

  historyForward() {
    if (this.historyIdx < this.viewHistory.length - 1) {
      this.historyIdx++;
      const target = this.viewHistory[this.historyIdx];
      this.currentView = target;
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`view-${target}`).classList.add('active');
    }
  }

  updateGreeting() {
    const h = new Date().getHours();
    let g = 'Good morning';
    if (h >= 12 && h < 18) g = 'Good afternoon';
    else if (h >= 18) g = 'Good evening';
    const el = document.getElementById('greeting-title');
    if (el) el.textContent = g;
  }

  /* ==========================================================================
     EVENT LISTENERS & SCRUBBERS
     ========================================================================== */
  setupUIEventListeners() {
    // Desktop Progress Scrubber
    const progressWrapper = document.getElementById('progress-bar-wrapper');
    if (progressWrapper) {
      progressWrapper.addEventListener('click', (e) => {
        const rect = progressWrapper.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        this.seek(pct);
      });
    }

    // NPV Progress Scrubber
    const npvProgress = document.getElementById('npv-progress-bar-bg');
    if (npvProgress) {
      npvProgress.addEventListener('click', (e) => {
        const rect = npvProgress.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        this.seek(pct);
      });
    }

    // Volume Scrubber
    const volumeWrapper = document.getElementById('volume-slider-wrapper');
    if (volumeWrapper) {
      volumeWrapper.addEventListener('click', (e) => {
        const rect = volumeWrapper.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        this.setVolume(pct);
      });
    }

    // Global Search Inputs
    const searchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    let debounceTimer = null;

    const onSearchChange = (val) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.performSearch(val);
      }, 250);
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.navigate('search');
        onSearchChange(e.target.value);
        document.getElementById('clear-search-btn').style.display = e.target.value ? 'block' : 'none';
      });
    }

    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        this.navigate('search');
        onSearchChange(e.target.value);
      });
    }
  }

  clearSearch() {
    const input = document.getElementById('global-search-input');
    input.value = '';
    document.getElementById('clear-search-btn').style.display = 'none';
    this.performSearch('');
  }

  handlePlayerLeftClick(e) {
    if (e.target.closest('.heart-btn')) return;
    this.toggleRightDrawer('npv');
  }

  /* ==========================================================================
     PWA & TOAST
     ========================================================================== */
  installPWA() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then(() => {
        window.deferredPrompt = null;
      });
    } else {
      this.showToast('To install, tap Share or Menu and choose "Add to Home Screen"');
    }
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  recordRecentlyPlayed(track) {
    this.recentlyPlayed = [track, ...this.recentlyPlayed.filter(t => t.id !== track.id)].slice(0, 50);
    this.saveToStorage('sp_recently_played', this.recentlyPlayed);
  }

  loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  saveToStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }
}

// Global App Instance
window.app = new SpotifyApp();

// Handle PWA Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'block';
});
