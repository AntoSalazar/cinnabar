const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Expand/contract the island window
  expandIsland: (width, height) => {
    ipcRenderer.send('expand-island', { width, height });
  },

  // Listen for music updates
  onMusicUpdate: (callback) => {
    ipcRenderer.on('music-update', (event, data) => callback(data));
  },

  // Listen for notification updates
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, data) => callback(data));
  },

  // Media controls
  mediaPlayPause: () => ipcRenderer.invoke('media-play-pause'),
  mediaNext: () => ipcRenderer.invoke('media-next'),
  mediaPrevious: () => ipcRenderer.invoke('media-previous'),
});
