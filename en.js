export default {
  app: {
    title: "WebMIDI Switcher"
  },
  
  connection: {
    status: {
      connected: "MIDI Connected (Input:{inputs} Output:{outputs})",
      disconnected: "MIDI Disconnected"
    },
    button: "Connect MIDI",
    deviceList: {
      title: "Connected Devices:",
      input: {
        title: "📥 Input ({count})",
        none: "None"
      },
      output: {
        title: "📤 Output ({count})", 
        none: "None"
      }
    }
  },

  controls: {
    toggle: {
      on: "ON",
      off: "OFF",
      ariaLabel: {
        turnOn: "Turn effect on",
        turnOff: "Turn effect off"
      }
    },
    settings: {
      channel: "MIDI Channel:",
      controller: "CC Number:"
    },
    wakeLock: {
      on: "🔒 Keep Screen On (ON)",
      off: "🔓 Keep Screen On (OFF)"
    }
  },

  log: {
    title: "MIDI Message Log",
    clearButton: "Clear",
    waitingMessage: "Waiting for MIDI messages...",
    source: {
      manual: "Manual Send"
    }
  },

  ui: {
    tabs: {
      control: "Control",
      settings: "Settings",
      midiHub: "MIDI Hub"
    },
    buttons: {
      update: "Update",
      disconnect: "Disconnect MIDI",
      clearCache: "Clear Cache",
      remove: "Remove",
      addButton: "Add Button",
      export: "Export",
      import: "Import",
      addMessage: "Add Message",
      removeMessage: "Remove"
    },
    settings: {
      buttonSettings: "Button Settings",
      otherSettings: "Other Settings",
      label: "Label",
      pressMessages: "Press MIDI Messages",
      releaseMessages: "Release MIDI Messages",
      language: "Language Settings",
      importExport: "Settings Import/Export"
    },
    serviceWorker: {
      info: "Service Worker Info:",
      version: "Version:",
      mode: "Mode:",
      devWarning: "⚠️ Cache is disabled in development mode"
    },
    update: {
      available: "New version available"
    },
    defaults: {
      effect: "Effect",
      button: "Button {number}"
    },
    languages: {
      ja: "日本語",
      en: "English"
    },
    midiTypes: {
      cc: "Control Change",
      note: "Note On/Off",
      program: "Program Change",
      pitch: "Pitch Bend"
    }
  },

  notifications: {
    device: {
      connected: {
        input: 'Input device "{name}" connected',
        output: 'Output device "{name}" connected'
      },
      disconnected: {
        input: 'Input device "{name}" disconnected', 
        output: 'Output device "{name}" disconnected'
      }
    },
    errors: {
      noDevicesFound: "No MIDI devices found",
      autoConnectionFailed: "MIDI auto-connection failed",
      connectionFailed: "MIDI connection failed",
      noOutputDevices: "No MIDI output devices connected",
      cacheClearFailed: "Cache clear failed",
      settingsImportFailed: "Settings import failed"
    },
    success: {
      cacheCleared: "Cache cleared successfully",
      devModeActive: "Developer Mode",
      settingsExported: "Settings exported successfully",
      settingsImported: "Settings imported successfully"
    }
  }
}