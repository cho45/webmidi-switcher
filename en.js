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
      noOutputDevices: "No MIDI output devices connected"
    }
  }
}