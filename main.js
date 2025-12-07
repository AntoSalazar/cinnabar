const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const dbus = require('dbus-next');

// Utility: Format time from microseconds
function formatTime(microseconds) {
  const seconds = Math.floor(microseconds / 1000000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let mainWindow;
let sessionBus;
let currentPlayer = null; // Store current player interface for controls

// Dynamic Island dimensions
const ISLAND_WIDTH = 170;
const ISLAND_HEIGHT = 44;
const ISLAND_EXPANDED_WIDTH = 380;
const ISLAND_EXPANDED_HEIGHT = 200;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Position at top-center
  const x = Math.floor((width - ISLAND_WIDTH) / 2);
  const y = 10;

  mainWindow = new BrowserWindow({
    x,
    y,
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Ignore mouse events on transparent areas
  mainWindow.setIgnoreMouseEvents(false);

  // Development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// Handle window expansion/contraction
ipcMain.on('expand-island', (event, { width, height }) => {
  if (!mainWindow) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const displayWidth = primaryDisplay.workAreaSize.width;
  const x = Math.floor((displayWidth - width) / 2);

  // Smooth animation by setting animate flag
  mainWindow.setBounds({
    x,
    y: 10,
    width,
    height,
  }, true); // true enables animation
});

// Media control handlers
ipcMain.handle('media-play-pause', async () => {
  if (!currentPlayer) return;
  try {
    await currentPlayer.PlayPause();
    console.log('⏯️  Play/Pause toggled');
  } catch (error) {
    console.error('Error toggling play/pause:', error);
  }
});

ipcMain.handle('media-next', async () => {
  if (!currentPlayer) return;
  try {
    await currentPlayer.Next();
    console.log('⏭️  Next track');
  } catch (error) {
    console.error('Error skipping to next:', error);
  }
});

ipcMain.handle('media-previous', async () => {
  if (!currentPlayer) return;
  try {
    await currentPlayer.Previous();
    console.log('⏮️  Previous track');
  } catch (error) {
    console.error('Error going to previous:', error);
  }
});

// Initialize D-Bus for Spotify/MPRIS
async function initDBus() {
  try {
    sessionBus = dbus.sessionBus();

    // Monitor MPRIS media players
    const obj = await sessionBus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
    const dbusInterface = obj.getInterface('org.freedesktop.DBus');

    // Listen for new media players
    dbusInterface.on('NameOwnerChanged', (name, oldOwner, newOwner) => {
      if (name.startsWith('org.mpris.MediaPlayer2.')) {
        if (newOwner) {
          console.log('Media player started:', name);
          subscribeToPlayer(name);
        } else if (oldOwner) {
          console.log('Media player stopped:', name);
        }
      }
    });

    // Check for existing players
    const names = await dbusInterface.ListNames();
    const mediaPlayers = names.filter(name => name.startsWith('org.mpris.MediaPlayer2.'));

    console.log('Found media players:', mediaPlayers);

    if (mediaPlayers.length > 0) {
      // Prefer Spotify if available (case-insensitive)
      const spotify = mediaPlayers.find(name => name.toLowerCase().includes('spotify'));
      const playerToUse = spotify || mediaPlayers[0];
      console.log('Using player:', playerToUse);
      subscribeToPlayer(playerToUse);
    } else {
      console.log('No media players found. Waiting for players to start...');
    }
  } catch (error) {
    console.error('D-Bus initialization error:', error);
  }
}

// Subscribe to media player updates
async function subscribeToPlayer(busName) {
  try {
    const player = await sessionBus.getProxyObject(busName, '/org/mpris/MediaPlayer2');
    const playerInterface = player.getInterface('org.mpris.MediaPlayer2.Player');
    const propsInterface = player.getInterface('org.freedesktop.DBus.Properties');

    // Store for media controls
    currentPlayer = playerInterface;

    // Send initial metadata with a small delay to let properties load
    setTimeout(() => updateMetadata(playerInterface, propsInterface), 100);

    // Listen for property changes
    propsInterface.on('PropertiesChanged', (iface, changedProps) => {
      if (iface === 'org.mpris.MediaPlayer2.Player') {
        console.log('Property changed:', Object.keys(changedProps));
        updateMetadata(playerInterface, propsInterface);
      }
    });

    console.log('Successfully subscribed to:', busName);
  } catch (error) {
    console.error('Error subscribing to player:', error);
  }
}

// Update and send metadata to renderer
async function updateMetadata(playerInterface, propsInterface) {
  try {
    // Use Properties interface to get values (more reliable than direct access)
    const metadata = await propsInterface.Get('org.mpris.MediaPlayer2.Player', 'Metadata');
    const playbackStatus = await propsInterface.Get('org.mpris.MediaPlayer2.Player', 'PlaybackStatus');

    if (!metadata || !metadata.value || Object.keys(metadata.value).length === 0) {
      console.log('No metadata available - player might be idle');
      return;
    }

    const metadataObj = metadata.value;

    // D-Bus variants need to be unwrapped - they're objects with .value property
    const getMetadataValue = (key) => {
      const value = metadataObj[key];
      if (!value) return null;
      // Handle D-Bus variant types
      return value.value !== undefined ? value.value : value;
    };

    const artist = getMetadataValue('xesam:artist');
    const title = getMetadataValue('xesam:title');

    // Only send update if we have at least a title
    if (!title) {
      console.log('No track title - waiting for playback');
      return;
    }

    // Get position and length for progress bar (convert BigInt to Number)
    const position = await propsInterface.Get('org.mpris.MediaPlayer2.Player', 'Position').catch(() => ({ value: 0 }));
    const length = getMetadataValue('mpris:length');

    // Convert BigInt to Number for JSON serialization
    const positionNum = typeof position.value === 'bigint' ? Number(position.value) : (position.value || 0);
    const lengthNum = typeof length === 'bigint' ? Number(length) : (length || 0);

    const trackInfo = {
      title: title,
      artist: Array.isArray(artist) ? artist[0] : (artist || 'Unknown Artist'),
      album: getMetadataValue('xesam:album') || '',
      artUrl: getMetadataValue('mpris:artUrl') || '',
      playing: playbackStatus.value === 'Playing',
      position: positionNum, // Position in microseconds
      length: lengthNum, // Length in microseconds
    };

    console.log('📀 Track info:', {
      title: trackInfo.title,
      artist: trackInfo.artist,
      playing: trackInfo.playing,
      progress: `${formatTime(positionNum)} / ${formatTime(lengthNum)}`
    });

    if (mainWindow) {
      mainWindow.webContents.send('music-update', trackInfo);
    }
  } catch (error) {
    console.error('Error getting metadata:', error.message);
  }
}

// Initialize notification monitoring
async function initNotifications() {
  try {
    const obj = await sessionBus.getProxyObject(
      'org.freedesktop.Notifications',
      '/org/freedesktop/Notifications'
    );
    const notifications = obj.getInterface('org.freedesktop.Notifications');

    // We'll intercept notifications by monitoring the D-Bus
    // Note: This is a simplified version; full implementation would require replacing the notification daemon
    console.log('Notification monitoring initialized');
  } catch (error) {
    console.error('Notification init error:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
  initDBus();
  initNotifications();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
