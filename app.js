import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import en from './en.js';
import ja from './ja.js';
import MIDIManager from './midi-manager.js';

/**
 * Vue I18n セットアップ
 */
const i18n = createI18n({
    legacy: false,
    locale: 'ja',
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
            midiOutputs: [],
            midiInputs: [],
            isEffectOn: false,
            wakeLock: null,
            wakeLockActive: false,
            lastToggleTime: 0,
            debounceMs: 300,
            deviceChangeNotification: '',
            errorNotification: '',
            settings: {
                channel: 0,
                controller: 64
            },
            midiLogs: [],
            maxLogs: 50
        }
    },

    methods: {
        async connectMIDI(autoConnect = false) {
            try {
                const connected = await this.midiManager.connect();

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
                this.midiConnected = connected;

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

        updateDeviceList() {
            this.midiInputs = this.midiManager.inputs;
            this.midiOutputs = this.midiManager.outputs;
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
                settings: this.settings
            };
            localStorage.setItem('midiSwitcherSettings', JSON.stringify(data));
        },

        loadSettings() {
            const saved = localStorage.getItem('midiSwitcherSettings');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                }
            }
        },

        toggleEffect() {
            const now = Date.now();
            if (now - this.lastToggleTime < this.debounceMs) {
                return;
            }
            this.lastToggleTime = now;

            if (this.midiOutputs.length === 0) {
                this.showErrorNotification(this.$t('notifications.errors.noOutputDevices'));
                return;
            }

            this.isEffectOn = !this.isEffectOn;
            const value = this.isEffectOn ? 127 : 0;
            
            const result = this.midiManager.sendControlChange(
                this.settings.channel,
                this.settings.controller,
                value
            );

            this.addMidiLog(result.source, result.destinations, result.message);
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
        this.loadSettings();
        this.wakeLockActive = false;
        this.requestWakeLock();

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
        settings: {
            handler() {
                this.saveSettings();
            },
            deep: true
        }
    }
});

// i18nプラグインを追加
app.use(i18n);

// アプリケーションをマウント  
app.mount('#app');