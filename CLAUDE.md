# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebMIDI Switcher is a PWA for MIDI message control using the WebMIDI API. The architecture emphasizes extreme simplicity with only 7 core files and no build process.

## Development Commands

This project uses direct file serving with no build system:

```bash
npx http-server

# For MIDI access, HTTPS is required in production
# Use ngrok or similar for HTTPS testing: ngrok http 8000
```

## Architecture

### Core Files (Keep to 7 files maximum)
- `index.html` - Single page with 3-screen UI (Main/Settings/MIDI Hub)
- `app.js` - Vue.js 3 application with all business logic
- `midi-manager.js` - WebMIDI API abstraction and event handling
- `en.js` / `ja.js` - i18n translation files
- `sw.js` - Service Worker with development/production cache strategies
- `manifest.json` - PWA configuration

### Technology Stack
- **Frontend**: Vue.js 3 (ESM via CDN) + Vue I18n
- **MIDI**: WebMIDI API with custom event system
- **Storage**: LocalStorage for settings persistence
- **Offline**: Service Worker with Network First (local) / Cache First (CDN) strategies

### Key Patterns

**3-Screen Architecture**:
- Main: MIDI control buttons (horizontal layout, dynamic sizing)
- Settings: Button configuration, language, import/export
- MIDI Hub: Device list and message log

**Button System**:
- Each button supports multiple MIDI messages on press/release
- Message types: CC, Note On/Off, Program Change, Pitch Bend
- Dynamic UI based on message type selection

**MIDI Manager Events**:
```javascript
midiManager.addEventListener('deviceConnected', handler);
midiManager.addEventListener('deviceDisconnected', handler);  
midiManager.addEventListener('midimessage', handler);
```

**Service Worker Cache Strategy**:
- Development mode: Bypass cache (detected by localhost/port)
- Production: Network First for local files, Cache First for CDN
- Manual cache versioning in `CACHE_NAME` constant

### Settings Architecture
- Settings stored in LocalStorage as JSON
- Export/import functionality for backup/sharing
- Language persistence with browser detection fallback
- Button configuration includes press/release message arrays

### Important Implementation Rules
- **Maintain simplicity**: User specifically rejects complex architectures
- **No build process**: Direct ES modules with import maps
- **Horizontal button layout**: Buttons must fill screen horizontally
- **No position:fixed**: Tabs flow normally at top of screen
- **Cache versioning**: Update `CACHE_NAME` in sw.js when deploying changes
- **Service Worker info**: Both `activated` and `info` message handlers needed for display

### MIDI Message Structure
```javascript
{
  type: 'cc|note|program|pitch',
  channel: 0-15,
  // Type-specific fields:
  controller: 0-127,  // CC only
  value: 0-127,       // CC, Pitch (0-16383)
  note: 0-127,        // Note only
  velocity: 0-127,    // Note only
  program: 0-127      // Program Change only
}
```

### Internationalization
- Complete i18n implementation required for all UI text
- Language detection from navigator.language
- Never hardcode Japanese/English strings in templates
- Translation keys follow dot notation (ui.tabs.control)

### PWA Requirements
- Must work completely offline
- Service Worker handles all caching
- Manifest configured for standalone display
- Update mechanism via service worker registration events
