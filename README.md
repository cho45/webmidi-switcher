# WebMIDI Switcher

スマートフォンをMIDI Hostとして機能させ、複数のMIDIデバイスを相互接続するためのProgressive Web App（PWA）です。

## 主な機能

### ️ スマホをMIDI Hostに
- WebMIDI APIを使用してスマートフォン（ブラウザ）がMIDI機器のホストとして動作
- USB-C to USBケーブルやUSBハブを使用してMIDI機器を直接接続可能
- 専用のMIDIインターフェースが不要

###  MIDIハブ機能
- **複数デバイス間の相互接続**: 接続されたMIDI入力デバイスからのメッセージを他の全出力デバイスに自動転送
- **デバイス状態監視**: 接続/切断の自動検出と通知

### 🎵 MIDI制御機能
- **カスタマイズ可能なボタン**: プレス/リリース時に複数のMIDIメッセージを送信
- **多様なメッセージタイプ**: CC（Control Change）、Note On/Off、Program Change、Pitch Bend
- **ホリゾンタルレイアウト**: スマホの画面に最適化されたボタン配置

## 技術仕様

### 動作要件
- WebMIDI API対応ブラウザ（Chrome、Edge等）
- HTTPS環境（本番環境）またはlocalhost（開発環境）
- USB MIDI対応デバイス

## セットアップ

### 開発環境
```bash
# HTTPサーバーを起動
npx http-server

# HTTPS環境が必要な場合（本番テスト用）
ngrok http 8000
```

### PWAインストール
1. スマートフォンのブラウザでアプリにアクセス
2. 「ホーム画面に追加」を選択
3. アプリアイコンからオフラインでも利用可能

## 使用方法

### 1. デバイス接続
- USB-C to USBケーブルでMIDI機器をスマホに接続
- アプリで「MIDI接続」ボタンをタップ
- 接続されたデバイスがMIDI Hubタブに表示される

### 2. MIDIハブとして使用
- 複数のMIDI機器を接続すると自動的にハブとして機能
- 入力デバイス（キーボード、パッド等）からのメッセージが他の出力デバイス（音源、DAW等）に転送される
- リアルタイムでメッセージログを確認可能

### 3. MIDI制御
- Controlタブでカスタムボタンを使用してMIDIメッセージを送信
- Settingsタブでボタンの動作を詳細設定
- プリセットの保存・読み込みが可能

## ファイル構成

- `index.html` - メインUI（3画面構成）
- `app.js` - Vue.jsアプリケーション本体
- `midi-manager.js` - WebMIDI APIの抽象化とイベント処理
- `en.js` / `ja.js` - 国際化対応翻訳ファイル
- `sw.js` - Service Worker（キャッシュ機能）
- `manifest.json` - PWA設定
