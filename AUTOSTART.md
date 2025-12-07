# Auto-Start Setup Guide

This guide will help you set up Dynamic Island to start automatically when you log into your Linux system.

## Prerequisites

- Node.js and npm installed
- Dynamic Island project cloned/downloaded
- Linux desktop environment (tested on Linux Mint Cinnamon, works on GNOME, KDE, etc.)

## Quick Setup

### 1. Create the Startup Script

Create a file named `start.sh` in your project directory:

```bash
cd /path/to/dynamic-island-linux
nano start.sh
```

Add the following content (replace `/path/to/dynamic-island-linux` with your actual path):

```bash
#!/bin/bash
# Dynamic Island Startup Script

# Wait for disk to be mounted (max 30 seconds)
PROJECT_DIR="/path/to/dynamic-island-linux"
MAX_WAIT=30
WAITED=0

echo "Waiting for project directory to be available..."
while [ ! -d "$PROJECT_DIR" ] && [ $WAITED -lt $MAX_WAIT ]; do
  sleep 1
  WAITED=$((WAITED + 1))
done

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project directory not found after ${MAX_WAIT} seconds"
  exit 1
fi

echo "Project directory found, starting Dynamic Island..."

# Navigate to project directory
cd "$PROJECT_DIR"

# Start the application
npm start
```

Make the script executable:

```bash
chmod +x start.sh
```

### 2. Create the Desktop Entry

Create the autostart directory if it doesn't exist:

```bash
mkdir -p ~/.config/autostart
```

Create the desktop entry file:

```bash
nano ~/.config/autostart/dynamic-island.desktop
```

Add the following content (replace paths with your actual paths):

```ini
[Desktop Entry]
Type=Application
Name=Dynamic Island
Comment=macOS-style Dynamic Island for Linux
Exec=/path/to/dynamic-island-linux/start.sh
Icon=/path/to/dynamic-island-linux/icon.png
Terminal=false
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
```

Make the desktop entry executable:

```bash
chmod +x ~/.config/autostart/dynamic-island.desktop
```

### 3. Test the Setup

Test the startup script manually:

```bash
/path/to/dynamic-island-linux/start.sh
```

If it works, log out and log back in. The Dynamic Island should start automatically!

## Special Cases

### Project on External/Mounted Disk

If your project is on an external drive or mounted partition:

1. The startup script already includes a 30-second wait for the disk to mount
2. If you need more time, increase `MAX_WAIT=30` to a higher value in `start.sh`
3. Ensure your disk auto-mounts on login (check Disks utility in Linux Mint)

**To ensure disk auto-mounts:**
1. Open "Disks" application
2. Select your disk/partition
3. Click the gear icon → "Edit Mount Options"
4. Disable "User Session Defaults"
5. Enable "Mount at system startup"

### Running in Background

If you want to see the app output for debugging, change in the desktop entry:

```ini
Terminal=true
```

For silent background execution (recommended):

```ini
Terminal=false
```

### Delay Startup

If the app starts too early and fails, add a delay in the desktop entry:

```ini
X-GNOME-Autostart-Delay=10
```

This delays startup by 10 seconds.

## Verification

Check if the desktop entry is recognized:

```bash
ls -la ~/.config/autostart/dynamic-island.desktop
```

View startup applications (Linux Mint):
1. Open Menu → Preferences → Startup Applications
2. You should see "Dynamic Island" listed

## Troubleshooting

### App doesn't start on login

1. **Check if the script works manually:**
   ```bash
   /path/to/dynamic-island-linux/start.sh
   ```

2. **Check autostart directory:**
   ```bash
   ls ~/.config/autostart/
   ```

3. **Check file permissions:**
   ```bash
   ls -la ~/.config/autostart/dynamic-island.desktop
   ls -la /path/to/dynamic-island-linux/start.sh
   ```
   Both should be executable (have `x` in permissions)

4. **Check logs:**
   Some desktop environments log startup app errors. Check:
   ```bash
   journalctl --user -b
   ```

### Mounted disk not ready

If your external disk isn't mounting in time:

1. Increase wait time in `start.sh`:
   ```bash
   MAX_WAIT=60  # Wait up to 60 seconds
   ```

2. Check disk UUID and ensure it's in `/etc/fstab` for automatic mounting

3. Add explicit mount command in the script before the wait loop:
   ```bash
   # Try to mount if not already mounted
   sudo mount /dev/sdXY /media/teracrow/Anto 2>/dev/null
   ```

### App crashes on startup

1. **Enable terminal output** to see errors:
   Edit `~/.config/autostart/dynamic-island.desktop`:
   ```ini
   Terminal=true
   ```

2. **Add logging** to the startup script:
   ```bash
   npm start > ~/dynamic-island.log 2>&1
   ```

3. **Check the log:**
   ```bash
   cat ~/dynamic-island.log
   ```

## Disabling Auto-Start

### Temporary (one session)

Just close the Dynamic Island app.

### Permanent

Remove the desktop entry:

```bash
rm ~/.config/autostart/dynamic-island.desktop
```

Or disable it in Startup Applications GUI (uncheck the checkbox).

## Alternative: Systemd Service (Advanced)

For more control, you can create a systemd user service:

```bash
nano ~/.config/systemd/user/dynamic-island.service
```

```ini
[Unit]
Description=Dynamic Island
After=graphical-session.target

[Service]
Type=simple
ExecStart=/path/to/dynamic-island-linux/start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

Enable and start:

```bash
systemctl --user enable dynamic-island.service
systemctl --user start dynamic-island.service
```

Check status:

```bash
systemctl --user status dynamic-island.service
```

## Tips

- **First time setup:** Run `npm install` in the project directory before setting up auto-start
- **Keep it updated:** Pull latest changes with `git pull` periodically
- **Performance:** The app is lightweight and shouldn't impact system performance
- **Multiple monitors:** Auto-start works on multi-monitor setups

## Support

If you encounter issues not covered here, check:
- GitHub Issues: [dynamic-island-linux/issues](https://github.com/AntoSalazar/dynamic-island-linux/issues)
- System logs: `journalctl --user -b`
- Electron logs: Check developer console in the app

---

**Enjoy your Dynamic Island!** 🎵✨
