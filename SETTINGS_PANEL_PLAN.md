# Settings Panel Implementation Plan

## Overview

Add a comprehensive settings/control panel to Dynamic Island that allows users to customize appearance, behavior, and functionality without editing code.

## Goals

- **User-Friendly**: Non-technical users can customize the island
- **Real-Time Preview**: See changes immediately
- **Persistent**: Settings saved between sessions
- **Extensible**: Easy to add new settings in the future
- **Performance**: Minimal impact on island performance

---

## Feature Scope

### Phase 1: Visual Customization
- Colors (background, text, accents)
- Transparency/opacity
- Border radius
- Shadow intensity
- Blur effects

### Phase 2: Layout & Typography
- Font family selection
- Font size scaling
- Spacing/padding adjustments
- Island dimensions
- Animation speed

### Phase 3: Behavior
- Auto-collapse timing
- Click behavior
- Keyboard shortcuts
- Position on screen
- Multi-monitor support

### Phase 4: Advanced
- Theme presets (Dark, Light, Colorful, Minimal)
- Custom CSS injection
- Import/Export settings
- Reset to defaults

---

## Technical Architecture

### 1. Settings Storage

**Location**: `~/.config/dynamic-island/settings.json`

**Structure**:
```json
{
  "version": "1.0.0",
  "appearance": {
    "background": {
      "color": "#000000",
      "opacity": 0.95,
      "blur": 10
    },
    "border": {
      "color": "#ffffff",
      "opacity": 0.1,
      "width": 1,
      "radius": {
        "compact": 22,
        "expanded": 24
      }
    },
    "shadow": {
      "enabled": true,
      "color": "#000000",
      "opacity": 0.3,
      "blur": 16,
      "offsetX": 0,
      "offsetY": 4
    },
    "accent": {
      "primary": "#667eea",
      "secondary": "#764ba2"
    }
  },
  "typography": {
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
    "fontSize": {
      "title": 15,
      "subtitle": 13,
      "small": 11
    },
    "fontWeight": {
      "normal": 400,
      "semibold": 600,
      "bold": 700
    }
  },
  "layout": {
    "dimensions": {
      "compact": {
        "width": 170,
        "height": 44
      },
      "expanded": {
        "width": 380,
        "height": 200
      }
    },
    "padding": {
      "compact": 0,
      "expanded": 16
    },
    "spacing": {
      "gap": 6,
      "itemGap": 5
    }
  },
  "animations": {
    "spring": {
      "stiffness": 120,
      "damping": 22,
      "bounce": 0.15
    },
    "transitions": {
      "duration": 0.3,
      "easing": [0.25, 0.1, 0.25, 1]
    }
  },
  "behavior": {
    "autoCollapse": {
      "enabled": true,
      "delay": 3000
    },
    "position": {
      "x": "center",
      "y": 10
    },
    "shortcuts": {
      "toggle": "Super+D",
      "settings": "Super+Shift+D"
    }
  },
  "theme": {
    "preset": "default",
    "customThemes": []
  }
}
```

### 2. Settings Manager Module

**File**: `src/services/settingsManager.ts`

```typescript
class SettingsManager {
  private settings: Settings;
  private configPath: string;
  private watchers: Set<(settings: Settings) => void>;

  constructor() {
    this.configPath = path.join(os.homedir(), '.config/dynamic-island/settings.json');
    this.settings = this.loadSettings();
    this.watchers = new Set();
  }

  // Load settings from disk
  loadSettings(): Settings {
    // Read from file or return defaults
  }

  // Save settings to disk
  saveSettings(settings: Partial<Settings>): void {
    // Merge with existing and save
  }

  // Get current settings
  get(): Settings {
    return this.settings;
  }

  // Update specific setting
  update(path: string, value: any): void {
    // Update nested property
    // Trigger watchers
    // Save to disk
  }

  // Watch for changes
  watch(callback: (settings: Settings) => void): void {
    this.watchers.add(callback);
  }

  // Reset to defaults
  reset(): void {
    this.settings = getDefaultSettings();
    this.saveSettings(this.settings);
  }

  // Export settings
  export(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import settings
  import(json: string): void {
    const settings = JSON.parse(json);
    this.saveSettings(settings);
  }
}
```

### 3. Settings UI Component

**File**: `src/components/SettingsPanel.tsx`

**Structure**:
```
SettingsPanel
├── SettingsHeader (title, close button)
├── SettingsTabs
│   ├── AppearanceTab
│   ├── LayoutTab
│   ├── BehaviorTab
│   └── AdvancedTab
└── SettingsFooter (reset, import/export, save)
```

### 4. Integration with Main App

**Updates needed**:

1. **main.cjs**:
   - Initialize SettingsManager
   - Apply window settings (size, position)
   - Expose IPC channels for settings

2. **DynamicIsland.tsx**:
   - Consume settings from SettingsManager
   - Apply theme/appearance settings dynamically
   - React to settings changes

3. **Keyboard Shortcuts**:
   - Register global shortcuts
   - Open settings panel on shortcut

---

## UI/UX Design

### Settings Panel Layout

**Window Type**: Separate Electron window (like VS Code settings)

**Dimensions**: 800x600px

**Layout**:
```
┌─────────────────────────────────────────────┐
│  Dynamic Island Settings              [×]   │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Tabs     │  Settings Content                │
│          │                                  │
│ • Appear │  ┌─────────────────────────────┐│
│   ance   │  │ Background Color            ││
│          │  │ ▇ #000000        [picker]   ││
│ • Layout │  └─────────────────────────────┘│
│          │                                  │
│ • Behav  │  ┌─────────────────────────────┐│
│   ior    │  │ Opacity                     ││
│          │  │ ━━━━━●────────── 95%        ││
│ • Advanc │  └─────────────────────────────┘│
│   ed     │                                  │
│          │  Live Preview:                   │
│          │  ┌─────────────────────────────┐│
│          │  │  [Island Preview]           ││
│          │  └─────────────────────────────┘│
│          │                                  │
├──────────┴──────────────────────────────────┤
│  [Reset to Defaults]  [Import] [Export]    │
│                         [Cancel]  [Save]    │
└─────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Color Picker
- Visual color picker with hex input
- Opacity slider
- Recently used colors
- Preset color palettes

#### 2. Slider Controls
- Range sliders for numeric values
- Real-time value display
- Min/max constraints
- Step increments

#### 3. Dropdown Selects
- Font family selection
- Theme preset selection
- Easing curve selection

#### 4. Toggle Switches
- Enable/disable features
- Animated toggle states

#### 5. Live Preview
- Mini version of Dynamic Island
- Updates in real-time
- Shows current settings applied

---

## Implementation Steps

### Step 1: Setup Settings Infrastructure
- [ ] Create settings schema/types
- [ ] Implement SettingsManager class
- [ ] Create default settings configuration
- [ ] Add settings file I/O
- [ ] Test settings persistence

### Step 2: Build Settings Panel UI
- [ ] Create SettingsPanel component structure
- [ ] Implement tab navigation
- [ ] Build individual setting controls (color picker, sliders, etc.)
- [ ] Add live preview component
- [ ] Style with Tailwind CSS

### Step 3: Appearance Settings
- [ ] Background color and opacity controls
- [ ] Border customization
- [ ] Shadow settings
- [ ] Accent color selection
- [ ] Blur effects

### Step 4: Layout Settings
- [ ] Dimension controls (width/height)
- [ ] Padding adjustments
- [ ] Spacing controls
- [ ] Font size scaling

### Step 5: Behavior Settings
- [ ] Auto-collapse timing
- [ ] Position adjustment
- [ ] Click behavior options
- [ ] Keyboard shortcuts configuration

### Step 6: Advanced Features
- [ ] Theme presets (create 4-5 presets)
- [ ] Import/Export functionality
- [ ] Custom CSS injection
- [ ] Reset to defaults

### Step 7: Integration
- [ ] Connect settings to main app
- [ ] Apply settings dynamically
- [ ] Handle settings updates in real-time
- [ ] Add keyboard shortcut to open settings

### Step 8: Polish & Testing
- [ ] Validate all inputs
- [ ] Error handling
- [ ] Smooth animations
- [ ] Accessibility (keyboard navigation)
- [ ] Documentation

---

## Technical Challenges & Solutions

### Challenge 1: Real-Time Preview
**Problem**: Updating preview without affecting main island
**Solution**:
- Create isolated preview component
- Use React context to share settings
- Apply settings via CSS variables for instant updates

### Challenge 2: Complex Nested Settings
**Problem**: Managing deeply nested settings object
**Solution**:
- Use lodash `get`/`set` for nested paths
- Implement settings path notation: `appearance.background.color`
- Provide TypeScript types for autocomplete

### Challenge 3: Performance
**Problem**: Real-time updates causing lag
**Solution**:
- Debounce slider inputs
- Use CSS variables for frequently changing values
- Memoize preview component
- Apply changes in requestAnimationFrame

### Challenge 4: Settings Migration
**Problem**: Breaking changes between versions
**Solution**:
- Include version number in settings
- Write migration functions
- Validate and merge with defaults on load

### Challenge 5: Custom CSS Safety
**Problem**: User-injected CSS could break layout
**Solution**:
- Sandbox custom CSS in scoped container
- Validate CSS before applying
- Provide "safe mode" to disable custom CSS

---

## Default Theme Presets

### 1. Default (Current)
```json
{
  "name": "Default",
  "background": "#000000",
  "opacity": 0.95,
  "accent": "#667eea"
}
```

### 2. Light Mode
```json
{
  "name": "Light",
  "background": "#ffffff",
  "opacity": 0.98,
  "accent": "#3b82f6",
  "text": "#000000"
}
```

### 3. Catppuccin Mocha
```json
{
  "name": "Catppuccin",
  "background": "#1e1e2e",
  "opacity": 0.95,
  "accent": "#cba6f7",
  "text": "#cdd6f4"
}
```

### 4. Nord
```json
{
  "name": "Nord",
  "background": "#2e3440",
  "opacity": 0.95,
  "accent": "#88c0d0",
  "text": "#eceff4"
}
```

### 5. Dracula
```json
{
  "name": "Dracula",
  "background": "#282a36",
  "opacity": 0.95,
  "accent": "#bd93f9",
  "text": "#f8f8f2"
}
```

### 6. Minimal Glass
```json
{
  "name": "Glass",
  "background": "#000000",
  "opacity": 0.3,
  "blur": 20,
  "accent": "#ffffff"
}
```

---

## IPC Communication

### Channels Needed

**Main → Renderer**:
- `settings:get` - Get current settings
- `settings:update` - Settings were updated
- `settings:reset` - Settings were reset

**Renderer → Main**:
- `settings:load` - Load settings
- `settings:save` - Save settings
- `settings:import` - Import from JSON
- `settings:export` - Export to JSON
- `settings:open-panel` - Open settings window

**Example**:
```typescript
// In main.cjs
ipcMain.handle('settings:load', async () => {
  return settingsManager.get();
});

ipcMain.handle('settings:save', async (event, settings) => {
  settingsManager.saveSettings(settings);
  // Notify all windows
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('settings:update', settings);
  });
});

// In React component
const settings = await window.electronAPI.getSettings();
await window.electronAPI.saveSettings(newSettings);
```

---

## File Structure

```
src/
├── components/
│   ├── settings/
│   │   ├── SettingsPanel.tsx          # Main panel
│   │   ├── SettingsTabs.tsx           # Tab navigation
│   │   ├── tabs/
│   │   │   ├── AppearanceTab.tsx      # Color, transparency, etc.
│   │   │   ├── LayoutTab.tsx          # Dimensions, spacing
│   │   │   ├── BehaviorTab.tsx        # Auto-collapse, shortcuts
│   │   │   └── AdvancedTab.tsx        # Themes, import/export
│   │   ├── controls/
│   │   │   ├── ColorPicker.tsx        # Color selection
│   │   │   ├── SliderControl.tsx      # Numeric sliders
│   │   │   ├── ToggleSwitch.tsx       # On/off toggles
│   │   │   ├── SelectDropdown.tsx     # Dropdowns
│   │   │   └── KeybindInput.tsx       # Keyboard shortcut input
│   │   └── LivePreview.tsx            # Preview component
│   └── DynamicIsland.tsx              # Updated to use settings
├── services/
│   ├── settingsManager.ts             # Settings management
│   └── themePresets.ts                # Default themes
├── types/
│   └── settings.ts                    # TypeScript definitions
└── utils/
    ├── settingsDefaults.ts            # Default values
    └── settingsMigration.ts           # Version migration
```

---

## Settings Type Definitions

```typescript
// src/types/settings.ts

export interface Settings {
  version: string;
  appearance: AppearanceSettings;
  typography: TypographySettings;
  layout: LayoutSettings;
  animations: AnimationSettings;
  behavior: BehaviorSettings;
  theme: ThemeSettings;
}

export interface AppearanceSettings {
  background: {
    color: string;
    opacity: number;
    blur: number;
  };
  border: {
    color: string;
    opacity: number;
    width: number;
    radius: {
      compact: number;
      expanded: number;
    };
  };
  shadow: {
    enabled: boolean;
    color: string;
    opacity: number;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  accent: {
    primary: string;
    secondary: string;
  };
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: {
    title: number;
    subtitle: number;
    small: number;
  };
  fontWeight: {
    normal: number;
    semibold: number;
    bold: number;
  };
}

export interface LayoutSettings {
  dimensions: {
    compact: { width: number; height: number };
    expanded: { width: number; height: number };
  };
  padding: {
    compact: number;
    expanded: number;
  };
  spacing: {
    gap: number;
    itemGap: number;
  };
}

export interface AnimationSettings {
  spring: {
    stiffness: number;
    damping: number;
    bounce: number;
  };
  transitions: {
    duration: number;
    easing: number[];
  };
}

export interface BehaviorSettings {
  autoCollapse: {
    enabled: boolean;
    delay: number;
  };
  position: {
    x: number | 'center';
    y: number;
  };
  shortcuts: {
    toggle: string;
    settings: string;
  };
}

export interface ThemeSettings {
  preset: string;
  customThemes: Theme[];
}

export interface Theme {
  name: string;
  settings: Partial<Settings>;
}
```

---

## Validation & Error Handling

### Input Validation Rules

1. **Colors**: Valid hex format (#RRGGBB or #RRGGBBAA)
2. **Numbers**: Within min/max ranges
3. **Opacity**: 0-1 range
4. **Dimensions**: Minimum 50px, maximum 1000px
5. **Font sizes**: 8px - 32px range

### Error Recovery

1. **Invalid Settings File**:
   - Show error notification
   - Load defaults
   - Backup corrupted file

2. **Failed Save**:
   - Retry with exponential backoff
   - Show error to user
   - Keep changes in memory

3. **Invalid Import**:
   - Validate JSON structure
   - Check required fields
   - Show specific error messages

---

## User Documentation

### Quick Start Guide
- How to open settings (keyboard shortcut)
- Overview of each tab
- How to save changes
- Reset to defaults

### Customization Examples
- Creating a light theme
- Adjusting animation speed
- Changing island size
- Setting up keyboard shortcuts

### Troubleshooting
- Settings not saving
- Island looks broken
- Reset to safe mode

---

## Future Enhancements

### Phase 5: Plugin System
- Allow community plugins
- Custom widgets in expanded view
- Integration with other apps

### Phase 6: Cloud Sync
- Sync settings across machines
- Share themes with community
- Online theme marketplace

### Phase 7: Profiles
- Multiple configuration profiles
- Switch between profiles
- Schedule profile changes (work vs personal)

---

## Success Metrics

- **Ease of Use**: Users can customize without documentation
- **Performance**: Settings changes apply in < 100ms
- **Reliability**: No data loss, settings always save correctly
- **Adoption**: 70%+ of users customize at least one setting

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Settings complexity overwhelms users | High | Progressive disclosure, good defaults, presets |
| Performance degradation | Medium | Optimize renders, use CSS variables, debounce |
| Breaking changes in updates | High | Versioning, migration system, validation |
| User breaks app with bad settings | Medium | Validation, reset option, safe mode |

---

## Timeline Overview

The implementation can be broken into sprints:

**Sprint 1**: Infrastructure (Settings Manager, storage, IPC)
**Sprint 2**: Basic UI (Panel structure, tabs, simple controls)
**Sprint 3**: Appearance Settings (Colors, transparency, shadows)
**Sprint 4**: Layout & Typography Settings
**Sprint 5**: Behavior & Animation Settings
**Sprint 6**: Theme Presets & Advanced Features
**Sprint 7**: Polish, Testing, Documentation

Each sprint builds on the previous, allowing incremental delivery.

---

## Conclusion

This settings panel will transform Dynamic Island from a developer-focused tool to a user-friendly application. By providing comprehensive customization options with an intuitive interface, users can make the island truly their own.

**Next Steps**:
1. Review and approve this plan
2. Create GitHub issues for each major component
3. Set up project board for tracking
4. Begin with Sprint 1 (Infrastructure)

---

**Questions or suggestions?** Open an issue or discussion on GitHub!
