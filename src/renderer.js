// Dynamic Island States
const STATES = {
  COMPACT: 'compact',
  MUSIC: 'music',
  NOTIFICATION: 'notification',
};

const DIMENSIONS = {
  compact: { width: 170, height: 44 },
  music: { width: 380, height: 200 },
  notification: { width: 350, height: 80 },
};

let currentState = STATES.COMPACT;
let currentTrack = null;
let autoCollapseTimeout = null;
let progressInterval = null;

// DOM Elements
const island = document.getElementById('island');
const compactView = document.getElementById('compact-view');
const musicView = document.getElementById('music-view');
const notificationView = document.getElementById('notification-view');

const compactIdle = document.querySelector('.compact-idle');
const compactMusic = document.querySelector('.compact-music');
const compactAlbumArt = document.getElementById('compact-album-art');

const albumArt = document.getElementById('album-art');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const progressFill = document.getElementById('progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeRemaining = document.getElementById('time-remaining');

// Utility: Format time from microseconds to MM:SS
function formatTime(microseconds) {
  const seconds = Math.floor(microseconds / 1000000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// State Management
function setState(newState) {
  if (currentState === newState) return;

  currentState = newState;

  // Clear auto-collapse timer
  if (autoCollapseTimeout) {
    clearTimeout(autoCollapseTimeout);
    autoCollapseTimeout = null;
  }

  // Update UI
  switch (newState) {
    case STATES.COMPACT:
      showCompactView();
      break;
    case STATES.MUSIC:
      showMusicView();
      break;
    case STATES.NOTIFICATION:
      showNotificationView();
      break;
  }

  // Resize window with delay to sync with CSS animation
  setTimeout(() => {
    const dimensions = DIMENSIONS[newState];
    window.electronAPI.expandIsland(dimensions.width, dimensions.height);
  }, 50);
}

function showCompactView() {
  island.classList.remove('expanded');

  compactView.classList.remove('hidden');

  // Show music preview if we have a track, otherwise show idle
  if (currentTrack) {
    compactIdle.classList.add('hidden');
    compactMusic.classList.remove('hidden');

    // Update compact state based on playing status
    if (currentTrack.playing) {
      compactMusic.classList.remove('paused');
    } else {
      compactMusic.classList.add('paused');
    }
  } else {
    compactIdle.classList.remove('hidden');
    compactMusic.classList.add('hidden');
  }

  musicView.classList.remove('visible');
  musicView.classList.add('hidden');
  notificationView.classList.remove('visible');
  notificationView.classList.add('hidden');

  setTimeout(() => {
    musicView.style.display = 'none';
    notificationView.style.display = 'none';
  }, 400);

  // Stop progress updates
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function showMusicView() {
  island.classList.add('expanded');

  compactView.classList.add('hidden');
  musicView.style.display = 'block';
  setTimeout(() => {
    musicView.classList.remove('hidden');
    musicView.classList.add('visible');
  }, 10);

  notificationView.classList.remove('visible');
  notificationView.classList.add('hidden');

  // Start progress updates
  startProgressUpdates();
}

function showNotificationView() {
  island.classList.add('expanded');

  compactView.classList.add('hidden');
  musicView.classList.remove('visible');
  musicView.classList.add('hidden');

  notificationView.style.display = 'block';
  setTimeout(() => {
    notificationView.classList.remove('hidden');
    notificationView.classList.add('visible');
  }, 10);

  // Auto-collapse after 5 seconds
  autoCollapseTimeout = setTimeout(() => {
    setState(currentTrack ? STATES.MUSIC : STATES.COMPACT);
  }, 5000);
}

// Progress Bar Updates
function startProgressUpdates() {
  if (progressInterval) clearInterval(progressInterval);

  updateProgress();

  // Update every second if playing
  if (currentTrack && currentTrack.playing) {
    progressInterval = setInterval(() => {
      if (currentTrack && currentTrack.playing) {
        // Increment position by 1 second (1000000 microseconds)
        currentTrack.position += 1000000;
        updateProgress();
      }
    }, 1000);
  }
}

function updateProgress() {
  if (!currentTrack || !currentTrack.length) {
    progressFill.style.width = '0%';
    timeCurrent.textContent = '0:00';
    timeRemaining.textContent = '-0:00';
    return;
  }

  const percentage = (currentTrack.position / currentTrack.length) * 100;
  progressFill.style.width = `${Math.min(percentage, 100)}%`;

  timeCurrent.textContent = formatTime(currentTrack.position);
  const remaining = currentTrack.length - currentTrack.position;
  timeRemaining.textContent = '-' + formatTime(remaining);
}

// Music Player Updates
window.electronAPI.onMusicUpdate((trackInfo) => {
  console.log('🎵 RENDERER: Music update received:', trackInfo);
  currentTrack = trackInfo;

  // Update expanded view UI
  trackTitle.textContent = trackInfo.title;
  trackArtist.textContent = trackInfo.artist;

  if (trackInfo.artUrl) {
    albumArt.src = trackInfo.artUrl;
    compactAlbumArt.src = trackInfo.artUrl;
  } else {
    albumArt.src = '';
    compactAlbumArt.src = '';
  }

  // Update compact view state
  if (currentState === STATES.COMPACT) {
    compactIdle.classList.add('hidden');
    compactMusic.classList.remove('hidden');

    if (trackInfo.playing) {
      compactMusic.classList.remove('paused');
    } else {
      compactMusic.classList.add('paused');
    }
  }

  // Update play/pause icon and visualizer state
  if (trackInfo.playing) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    musicView.classList.remove('paused');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    musicView.classList.add('paused');
  }

  // Update progress
  updateProgress();

  // Expand to music view if playing
  if (trackInfo.playing && currentState !== STATES.NOTIFICATION) {
    setState(STATES.MUSIC);
  } else if (!trackInfo.playing && currentState === STATES.MUSIC) {
    // Auto-collapse after 3 seconds when paused
    autoCollapseTimeout = setTimeout(() => {
      setState(STATES.COMPACT);
    }, 3000);
  }

  // Restart progress updates if playing
  if (trackInfo.playing && currentState === STATES.MUSIC) {
    startProgressUpdates();
  } else if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
});

// Notification Updates
window.electronAPI.onNotification((notification) => {
  console.log('🔔 Notification:', notification);

  document.getElementById('notification-title').textContent = notification.title;
  document.getElementById('notification-body').textContent = notification.body;

  setState(STATES.NOTIFICATION);
});

// Click Handlers
island.addEventListener('click', (e) => {
  // Toggle between states
  if (currentState === STATES.COMPACT && currentTrack) {
    setState(STATES.MUSIC);
  } else if (currentState === STATES.MUSIC) {
    setState(STATES.COMPACT);
  }
});

// Play/Pause Button
document.getElementById('play-pause-btn')?.addEventListener('click', async (e) => {
  e.stopPropagation();
  console.log('🎵 Play/pause clicked');
  await window.electronAPI.mediaPlayPause();
});

// Previous Button
document.getElementById('prev-btn')?.addEventListener('click', async (e) => {
  e.stopPropagation();
  console.log('⏮️  Previous track clicked');
  await window.electronAPI.mediaPrevious();
});

// Next Button
document.getElementById('next-btn')?.addEventListener('click', async (e) => {
  e.stopPropagation();
  console.log('⏭️  Next track clicked');
  await window.electronAPI.mediaNext();
});

// AirPlay Button (placeholder)
document.getElementById('airplay-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('📡 AirPlay/Output selector clicked');
  // Could open a menu to select output device
});

// Hover effects
island.addEventListener('mouseenter', () => {
  if (currentState === STATES.COMPACT && currentTrack) {
    // Show mini preview on hover (optional)
  }
});

// Initialize
console.log('🏝️ Dynamic Island renderer initialized');
console.log('Island element:', island);
console.log('Compact view:', compactView);
console.log('Music view:', musicView);
