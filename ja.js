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

  ui: {
    tabs: {
      control: "コントロール",
      settings: "設定",
      midiHub: "MIDIハブ"
    },
    buttons: {
      update: "更新",
      disconnect: "MIDI切断",
      clearCache: "キャッシュクリア",
      remove: "削除",
      addButton: "ボタンを追加",
      export: "エクスポート",
      import: "インポート",
      addMessage: "メッセージを追加",
      removeMessage: "削除"
    },
    settings: {
      buttonSettings: "ボタン設定",
      otherSettings: "その他の設定",
      label: "ラベル",
      pressMessages: "Press時のMIDIメッセージ",
      releaseMessages: "Release時のMIDIメッセージ",
      language: "言語設定",
      importExport: "設定のインポート・エクスポート"
    },
    serviceWorker: {
      info: "Service Worker情報:",
      version: "バージョン:",
      mode: "モード:",
      devWarning: "⚠️ 開発モードではキャッシュが無効化されます"
    },
    update: {
      available: "新しいバージョンが利用可能です"
    },
    defaults: {
      effect: "エフェクト",
      button: "ボタン{number}"
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
      noOutputDevices: "MIDI出力デバイスが接続されていません",
      cacheClearFailed: "キャッシュクリアに失敗しました",
      settingsImportFailed: "設定のインポートに失敗しました"
    },
    success: {
      cacheCleared: "キャッシュをクリアしました",
      devModeActive: "デベロッパーモード",
      settingsExported: "設定をエクスポートしました",
      settingsImported: "設定をインポートしました"
    }
  }
}