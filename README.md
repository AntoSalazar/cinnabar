# Dynamic Island for Linux

A macOS-inspired Dynamic Island implementation for Linux Mint Cinnamon using Electron.

## Features

- **Clean, Professional Design**: Glass-morphism UI with smooth animations
- **Spotify Integration**: Shows currently playing track via MPRIS D-Bus
- **Always Visible**: Persistent pill-shaped bar at top of screen
- **Smart Expansion**: Expands to show music controls and information
- **Native Linux Integration**: Uses D-Bus for system-level communication

## Screenshots

The Dynamic Island has three states:

1. **Compact**: Small pill shape when idle
2. **Music Player**: Expands to show album art, track info, and controls
3. **Notifications**: Displays system notifications

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Linux with D-Bus support
- Spotify or any MPRIS-compatible media player

### Setup

```bash
cd dynamic-island-linux
npm install
```

### Run

```bash
# Development mode (with DevTools)
npm run dev

# Production mode
npm start
```

## Configuration

### Auto-start on Login

Create a desktop entry file:

```bash
cat > ~/.config/autostart/dynamic-island.desktop <<EOF
[Desktop Entry]
Type=Application
Name=Dynamic Island
Exec=/usr/bin/node /path/to/dynamic-island-linux/main.js
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

Replace `/path/to/dynamic-island-linux/` with the actual path.

## How It Works

### Architecture

- **Main Process** (`main.js`): Creates the frameless, transparent window and handles D-Bus communication
- **Renderer Process** (`src/renderer.js`): Manages UI state and animations
- **Preload Script** (`preload.js`): Secure bridge between main and renderer processes

### Spotify Integration

The app uses **MPRIS D-Bus** interface to communicate with Spotify and other media players. This is a native Linux protocol that requires no additional configuration.

Supported media players:
- Spotify
- VLC
- Rhythmbox
- Any MPRIS2-compatible player

### Key Technologies

- **Electron**: Cross-platform desktop app framework
- **D-Bus**: Inter-process communication for Linux
- **CSS Backdrop Filter**: Glass-morphism effect
- **CSS Transitions**: Smooth state changes

## Customization

### Positioning

Edit `main.js` to change position:

```javascript
const x = Math.floor((width - ISLAND_WIDTH) / 2);  // Center
const y = 10;  // Top margin
```

### Dimensions

Adjust in `main.js`:

```javascript
const ISLAND_WIDTH = 150;
const ISLAND_HEIGHT = 37;
const ISLAND_EXPANDED_WIDTH = 400;
const ISLAND_EXPANDED_HEIGHT = 100;
```

### Colors & Styling

Edit `src/styles.css` to customize:

- Background: `.island { background: ... }`
- Gradient: `.pulse-indicator { background: linear-gradient(...) }`
- Border radius, shadows, animations, etc.

## Roadmap

- [ ] Full notification system integration
- [ ] Media player controls (play/pause/next/prev via D-Bus)
- [ ] Multiple notification queue
- [ ] Calendar/timer integration
- [ ] System monitoring (CPU, RAM, battery)
- [ ] Customizable themes
- [ ] Settings panel

## Known Issues

- Notification integration is partial (requires notification daemon access)
- Media player controls are UI-only (need D-Bus command implementation)
- No multi-monitor support yet

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
