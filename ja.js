export default {
  app: {
    title: "WebMIDI Switcher"
  },
  
  connection: {
    status: {
      connected: "MIDI接続済み (入力:{inputs} 出力:{outputs})",
      disconnected: "MIDI未接続"
    },
    button: "MIDI接続",
    deviceList: {
      title: "接続デバイス:",
      input: {
        title: "📥 入力 ({count})",
        none: "なし"
      },
      output: {
        title: "📤 出力 ({count})",
        none: "なし"
      }
    }
  },

  controls: {
    toggle: {
      on: "ON",
      off: "OFF",
      ariaLabel: {
        turnOn: "エフェクトをオンにする",
        turnOff: "エフェクトをオフにする"
      }
    },
    settings: {
      channel: "MIDIチャンネル:",
      controller: "CC番号:"
    },
    wakeLock: {
      on: "🔒 画面常時オン (ON)",
      off: "🔓 画面常時オン (OFF)"
    }
  },

  log: {
    title: "MIDIメッセージログ",
    clearButton: "クリア",
    waitingMessage: "MIDIメッセージを待機中...",
    source: {
      manual: "手動送信"
    }
  },

  notifications: {
    device: {
      connected: {
        input: '入力デバイス "{name}" が接続されました',
        output: '出力デバイス "{name}" が接続されました'
      },
      disconnected: {
        input: '入力デバイス "{name}" が切断されました',
        output: '出力デバイス "{name}" が切断されました'
      }
    },
    errors: {
      noDevicesFound: "MIDIデバイスが見つかりません",
      autoConnectionFailed: "MIDI自動接続に失敗しました", 
      connectionFailed: "MIDI接続に失敗しました",
      noOutputDevices: "MIDI出力デバイスが接続されていません"
    }
  }
}