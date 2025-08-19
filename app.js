import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import en from './en.js';
import ja from './ja.js';
import MIDIManager from './midi-manager.js';

/**
 * Vue I18n セットアップ
 */
// ブラウザの言語設定を取得
const detectLocale = () => {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('ja')) return 'ja';
    return 'en';
};

const i18n = createI18n({
    legacy: false,
    locale: detectLocale(),
    fallbackLocale: 'en',
    messages: {
        en,
        ja
    }
});

/**
 * メイン Vue.js アプリケーション
 */
const app = createApp({
    data() {
        return {
            midiManager: new MIDIManager(),
            midiConnected: false,
            midiAccessAvailable: false,
            midiOutputs: [],
            midiInputs: [],
            currentView: 'main',
            wakeLock: null,
            wakeLockActive: false,
            lastToggleTime: 0,
            debounceMs: 300,
            deviceChangeNotification: '',
            errorNotification: '',
            updateAvailable: false,
            newServiceWorker: null,
            swInfo: {
                version: '',
                isDev: false,
                registered: false
            },
            activeButtons: new Set(),
            buttons: [
                {
                    id: 0,
                    label: '', // 動的に設定される
                    press: [
                        { type: 'cc', channel: 0, controller: 64, value: 127 }
                    ],
                    release: [
                        { type: 'cc', channel: 0, controller: 64, value: 0 }
                    ]
                },
                {
                    id: 1,
                    label: '', // 動的に設定される
                    press: [
                        { type: 'cc', channel: 0, controller: 65, value: 127 }
                    ],
                    release: [
                        { type: 'cc', channel: 0, controller: 65, value: 0 }
                    ]
                }
            ],
            midiLogs: [],
            maxLogs: 50
        }
    },

    methods: {
        async connectMIDI(autoConnect = false) {
            try {
                const connected = await this.midiManager.connect();
                this.midiAccessAvailable = true;

                // デバイス接続時のイベントリスナーを設定
                this.midiManager.addEventListener('deviceConnected', (event) => {
                    this.updateDeviceList();
                    this.showDeviceConnectedNotification(event.detail.port);
                });

                // デバイス切断時のイベントリスナーを設定
                this.midiManager.addEventListener('deviceDisconnected', (event) => {
                    this.updateDeviceList();
                    this.showDeviceDisconnectedNotification(event.detail.port);
                });

                // MIDIメッセージ受信時のイベントリスナーを設定
                this.midiManager.addEventListener('midimessage', (event) => {
                    const { source, destinations, message } = event.detail;
                    this.addMidiLog(source, destinations, message);
                });

                this.updateDeviceList();

                if (connected) {
                    this.saveSettings();
                    console.log('MIDI connection successful');
                } else {
                    if (!autoConnect) {
                        this.showErrorNotification(this.$t('notifications.errors.noDevicesFound'));
                    }
                }
            } catch (error) {
                console.error('MIDI connection error:', error);
                const errorKey = autoConnect ? 
                    'notifications.errors.autoConnectionFailed' : 
                    'notifications.errors.connectionFailed';
                this.showErrorNotification(this.$t(errorKey));
            }
        },

        disconnectMIDI() {
            this.midiManager.cleanup();
            this.midiConnected = false;
            this.midiAccessAvailable = false;
            this.midiInputs = [];
            this.midiOutputs = [];
            this.midiLogs = [];
            console.log('MIDI disconnected');
        },

        updateDeviceList() {
            this.midiInputs = this.midiManager.inputs;
            this.midiOutputs = this.midiManager.outputs;
            // デバイスが1つでもあれば接続状態とする
            this.midiConnected = this.midiInputs.length > 0 || this.midiOutputs.length > 0;
        },

        showDeviceConnectedNotification(port) {
            const key = port.type === 'input' ? 'notifications.device.connected.input' : 'notifications.device.connected.output';
            this.deviceChangeNotification = this.$t(key, { name: port.name });
            
            setTimeout(() => {
                this.deviceChangeNotification = '';
            }, 5000);
        },

        showDeviceDisconnectedNotification(port) {
            const key = port.type === 'input' ? 'notifications.device.disconnected.input' : 'notifications.device.disconnected.output';
            this.deviceChangeNotification = this.$t(key, { name: port.name });
            
            setTimeout(() => {
                this.deviceChangeNotification = '';
            }, 5000);
        },

        showErrorNotification(message) {
            this.errorNotification = message;
            setTimeout(() => {
                this.errorNotification = '';
            }, 5000);
        },

        addMidiLog(source, destinations, message) {
            const logEntry = {
                id: Date.now() + Math.random(),
                timestamp: this.getTimestamp(),
                source: source || this.$t('log.source.manual'),
                destinations: destinations.length > 0 ? destinations : [this.$t('connection.deviceList.input.none')],
                message: this.formatMidiMessage(message)
            };

            this.midiLogs.unshift(logEntry);

            if (this.midiLogs.length > this.maxLogs) {
                this.midiLogs = this.midiLogs.slice(0, this.maxLogs);
            }

            this.$nextTick(() => {
                const logsElement = document.getElementById('midi-logs');
                if (logsElement) {
                    logsElement.scrollTop = 0;
                }
            });
        },

        clearLogs() {
            this.midiLogs = [];
        },

        formatMidiMessage(message) {
            const [status, data1, data2] = message;
            const channel = (status & 0x0F) + 1;
            const command = status & 0xF0;

            switch (command) {
                case 0x80:
                    return `Note Off Ch:${channel} Note:${data1} Vel:${data2}`;
                case 0x90:
                    return data2 === 0 ? 
                        `Note Off Ch:${channel} Note:${data1} Vel:${data2}` :
                        `Note On Ch:${channel} Note:${data1} Vel:${data2}`;
                case 0xA0:
                    return `Aftertouch Ch:${channel} Note:${data1} Pressure:${data2}`;
                case 0xB0:
                    return `CC Ch:${channel} Controller:${data1} Value:${data2}`;
                case 0xC0:
                    return `Program Change Ch:${channel} Program:${data1}`;
                case 0xD0:
                    return `Channel Pressure Ch:${channel} Pressure:${data1}`;
                case 0xE0:
                    const pitchValue = (data2 << 7) | data1;
                    return `Pitch Bend Ch:${channel} Value:${pitchValue}`;
                default:
                    return `Raw: [${message.map(b => b.toString(16).padStart(2, '0')).join(' ')}]`;
            }
        },

        getTimestamp() {
            const now = new Date();
            return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
        },

        saveSettings() {
            const data = {
                buttons: this.buttons,
                currentView: this.currentView,
                locale: this.$i18n.locale
            };
            localStorage.setItem('midiSwitcherSettings', JSON.stringify(data));
        },

        loadSettings() {
            const saved = localStorage.getItem('midiSwitcherSettings');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.buttons && Array.isArray(data.buttons)) {
                        this.buttons = data.buttons;
                    }
                    if (data.currentView) {
                        this.currentView = data.currentView;
                    }
                    if (data.locale) {
                        this.$i18n.locale = data.locale;
                    }
                } catch (error) {
                    console.error('Error loading settings:', error);
                }
            }
        },

        handleButtonPress(buttonId) {
            const now = Date.now();
            if (now - this.lastToggleTime < this.debounceMs) {
                return;
            }
            this.lastToggleTime = now;

            if (this.midiOutputs.length === 0) {
                this.showErrorNotification(this.$t('notifications.errors.noOutputDevices'));
                return;
            }

            const button = this.buttons[buttonId];
            if (!button) return;

            this.activeButtons.add(buttonId);
            
            const results = this.midiManager.sendMultipleMessages(button.press);
            results.forEach(result => {
                this.addMidiLog(result.source, result.destinations, result.message);
            });
        },

        handleButtonRelease(buttonId) {
            const button = this.buttons[buttonId];
            if (!button) return;

            this.activeButtons.delete(buttonId);
            
            const results = this.midiManager.sendMultipleMessages(button.release);
            results.forEach(result => {
                this.addMidiLog(result.source, result.destinations, result.message);
            });
        },

        addButton() {
            const newId = Math.max(...this.buttons.map(b => b.id)) + 1;
            this.buttons.push({
                id: newId,
                label: this.$t('ui.defaults.button', { number: newId + 1 }),
                press: [
                    { type: 'cc', channel: 0, controller: 70 + newId, value: 127 }
                ],
                release: [
                    { type: 'cc', channel: 0, controller: 70 + newId, value: 0 }
                ]
            });
        },

        removeButton(buttonId) {
            const index = this.buttons.findIndex(b => b.id === buttonId);
            if (index !== -1) {
                this.buttons.splice(index, 1);
                this.activeButtons.delete(buttonId);
            }
        },

        async requestWakeLock() {
            try {
                if (this.wakeLockActive && this.wakeLock) {
                    await this.wakeLock.release();
                    this.wakeLock = null;
                    this.wakeLockActive = false;
                    console.log('Wake lock released');
                } else {
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    this.wakeLockActive = true;

                    this.wakeLock.addEventListener('release', () => {
                        this.wakeLockActive = false;
                        console.log('Wake lock auto-released');
                    });

                    console.log('Wake lock activated');
                }
            } catch (error) {
                console.error('Wake lock operation failed:', error);
                this.wakeLockActive = false;
            }
        },

        showSuccessNotification(message) {
            this.deviceChangeNotification = message;
            setTimeout(() => {
                this.deviceChangeNotification = '';
            }, 3000);
        },

        async clearCache() {
            try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    // サービスワーカー経由でキャッシュクリア
                    navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
                    this.showSuccessNotification(this.$t('notifications.success.cacheCleared'));
                    console.log('Cache clear requested via service worker');
                } else if ('caches' in window) {
                    // 直接キャッシュクリア
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                    this.showSuccessNotification(this.$t('notifications.success.cacheCleared'));
                    console.log('All caches cleared directly');
                }
            } catch (error) {
                console.error('Cache clear failed:', error);
                this.showErrorNotification(this.$t('notifications.errors.cacheClearFailed'));
            }
        },

        async updateApp() {
            if (this.newServiceWorker) {
                this.newServiceWorker.postMessage({ action: 'skipWaiting' });
                this.updateAvailable = false;
                window.location.reload();
            }
        },

        initializeDefaultLabels() {
            // 空のラベルをデフォルト値で埋める
            this.buttons.forEach((button, index) => {
                if (!button.label) {
                    if (button.id === 0) {
                        button.label = this.$t('ui.defaults.effect');
                    } else {
                        button.label = this.$t('ui.defaults.button', { number: index + 1 });
                    }
                }
            });
        },

        changeLanguage(locale) {
            this.$i18n.locale = locale;
            this.saveSettings();
        },

        addMidiMessage(buttonId, eventType) {
            const button = this.buttons.find(b => b.id === buttonId);
            if (!button) return;
            
            const newMessage = {
                type: 'cc',
                channel: 0,
                controller: 1,
                value: eventType === 'press' ? 127 : 0
            };
            
            button[eventType].push(newMessage);
        },

        removeMidiMessage(buttonId, eventType, messageIndex) {
            const button = this.buttons.find(b => b.id === buttonId);
            if (!button || !button[eventType]) return;
            
            button[eventType].splice(messageIndex, 1);
        },

        updateMidiMessage(buttonId, eventType, messageIndex, field, value) {
            const button = this.buttons.find(b => b.id === buttonId);
            if (!button || !button[eventType] || !button[eventType][messageIndex]) return;
            
            // 数値フィールドは数値に変換
            if (['channel', 'controller', 'value', 'note', 'velocity', 'program'].includes(field)) {
                value = parseInt(value, 10);
                if (isNaN(value)) return;
            }
            
            button[eventType][messageIndex][field] = value;
        },

        exportSettings() {
            const settings = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                locale: this.$i18n.locale,
                buttons: this.buttons
            };
            
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `midi-switcher-settings-${new Date().toISOString().slice(0,19)}.json`;
            link.click();
            
            this.showSuccessNotification(this.$t('notifications.success.settingsExported'));
        },

        importSettings(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    
                    // バリデーション
                    if (!settings.buttons || !Array.isArray(settings.buttons)) {
                        throw new Error('Invalid settings format');
                    }
                    
                    // 設定を適用
                    this.buttons = settings.buttons;
                    if (settings.locale) {
                        this.changeLanguage(settings.locale);
                    }
                    
                    this.saveSettings();
                    this.showSuccessNotification(this.$t('notifications.success.settingsImported'));
                    
                } catch (error) {
                    console.error('Settings import error:', error);
                    this.showErrorNotification(this.$t('notifications.errors.settingsImportFailed'));
                }
            };
            reader.readAsText(file);
            
            // ファイル選択をリセット
            event.target.value = '';
        }
    },

    computed: {
        inputDeviceNames() {
            return this.midiInputs.map(input => input.name);
        },
        outputDeviceNames() {
            return this.midiOutputs.map(output => output.name);
        }
    },

    mounted() {
        this.initializeDefaultLabels();
        this.loadSettings();
        this.wakeLockActive = false;
        this.requestWakeLock();

        // Service Worker登録
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    
                    // アップデート検知
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('New service worker installing...');
                        
                        newWorker.addEventListener('statechange', () => {
                            console.log('Service Worker state:', newWorker.state);
                            
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // 既存のSWがある場合は更新を通知
                                    this.newServiceWorker = newWorker;
                                    this.updateAvailable = true;
                                    console.log('New version available - update ready');
                                } else {
                                    // 初回インストール
                                    console.log('Service Worker installed for the first time');
                                }
                            }
                        });
                    });

                    // Service Worker メッセージ受信
                    navigator.serviceWorker.addEventListener('message', event => {
                        const { action, version, isDev } = event.data || {};
                        console.log('SW Message:', event.data);
                        
                        switch (action) {
                            case 'activated':
                                console.log(`Service Worker activated: ${version} ${isDev ? '[DEV]' : '[PROD]'}`);
                                this.swInfo = { version, isDev, registered: true };
                                if (isDev) {
                                    this.showSuccessNotification(this.$t('notifications.success.devModeActive'));
                                }
                                break;
                                
                            case 'info':
                                console.log(`Service Worker info received: ${version} ${isDev ? '[DEV]' : '[PROD]'}`);
                                this.swInfo = { version, isDev, registered: true };
                                break;
                                
                            case 'cacheCleared':
                                console.log('Cache cleared by service worker');
                                break;
                                
                            case 'reload':
                                console.log('Reload requested by service worker');
                                window.location.reload();
                                break;
                        }
                    });

                    // 既にアクティブなサービスワーカーから情報を取得
                    if (registration.active) {
                        console.log('Service Worker already active, requesting info...');
                        registration.active.postMessage({ action: 'getInfo' });
                    }

                    // 定期的にアップデートをチェック（本番環境のみ）
                    setInterval(() => {
                        if (!window.location.hostname.includes('localhost')) {
                            registration.update();
                        }
                    }, 60000); // 1分ごと
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        setTimeout(() => {
            this.connectMIDI(true);
        }, 1000);
    },

    beforeUnmount() {
        this.midiManager.cleanup();
        if (this.wakeLock) {
            this.wakeLock.release().catch(console.error);
        }
    },

    watch: {
        buttons: {
            handler() {
                this.saveSettings();
            },
            deep: true
        },
        currentView() {
            this.saveSettings();
        }
    }
});

// i18nプラグインを追加
app.use(i18n);

// アプリケーションをマウント  
app.mount('#app');