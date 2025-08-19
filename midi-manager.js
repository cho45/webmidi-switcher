/**
 * MIDI管理クラス - デバイス接続とメッセージ処理を担当
 */
export default class MIDIManager extends EventTarget {
    constructor() {
        super();
        this.access = null;
        this.inputs = [];
        this.outputs = [];
        this.portStates = new Map(); // ポート状態を追跡
        this.boundHandlePortStateChange = this.handlePortStateChange.bind(this);
    }

    async connect() {
        try {
            this.access = await navigator.requestMIDIAccess({ sysex: false });
            
            // デバイス変更イベントを監視
            this.access.addEventListener('statechange', this.boundHandlePortStateChange);

            this.initializePortStates();
            this.updateDevices();
            return this.inputs.length > 0 || this.outputs.length > 0;
        } catch (error) {
            console.error('MIDI connection error:', error);
            throw error;
        }
    }

    updateDevices() {
        if (!this.access) return;

        // 既存のイベントリスナーをクリア
        this.inputs.forEach(input => {
            if (input.boundHandleMidiMessage) {
                input.removeEventListener('midimessage', input.boundHandleMidiMessage);
            }
        });

        // デバイスリストを更新（connectedのもののみ）
        this.outputs = Array.from(this.access.outputs.values()).filter(output => output.state === 'connected');
        this.inputs = Array.from(this.access.inputs.values()).filter(input => input.state === 'connected');

        // 入力デバイスにイベントリスナーを設定
        this.inputs.forEach(input => {
            input.boundHandleMidiMessage = (event) => {
                this.handleMidiMessage(event, input);
            };
            input.addEventListener('midimessage', input.boundHandleMidiMessage);
        });

        console.log('Device update completed - inputs:', this.inputs.length, 'outputs:', this.outputs.length);
    }

    handleMidiMessage(event, sourceInput) {
        const message = Array.from(event.data);
        const destinations = [];

        // 送信元以外の全出力デバイスに転送
        this.outputs.forEach(output => {
            if (output.name !== sourceInput.name) {
                try {
                    output.send(message);
                    destinations.push(output.name);
                } catch (error) {
                    console.error('MIDI transfer error:', error);
                }
            }
        });

        // カスタムイベントでアプリケーションに通知
        this.dispatchEvent(new CustomEvent('midimessage', {
            detail: {
                source: sourceInput.name,
                destinations,
                message
            }
        }));
    }

    sendControlChange(channel, controller, value) {
        const message = [0xB0 + channel, controller, value];
        const destinations = [];

        this.outputs.forEach(output => {
            try {
                output.send(message);
                destinations.push(output.name);
            } catch (error) {
                console.error('MIDI send error:', output.name, error);
            }
        });

        return {
            source: null,
            destinations,
            message
        };
    }

    sendMidiMessage(messageConfig) {
        const { type, channel, ...params } = messageConfig;
        let midiData;
        
        switch(type) {
            case 'cc':
                midiData = [0xB0 + channel, params.controller, params.value];
                break;
            case 'note':
                if (params.velocity > 0) {
                    midiData = [0x90 + channel, params.note, params.velocity];
                } else {
                    midiData = [0x80 + channel, params.note, 0];
                }
                break;
            case 'program':
                midiData = [0xC0 + channel, params.program];
                break;
            case 'pitch':
                const value = params.value || 8192; // Center position
                midiData = [0xE0 + channel, value & 0x7F, (value >> 7) & 0x7F];
                break;
            default:
                throw new Error(`Unsupported MIDI message type: ${type}`);
        }

        const destinations = [];
        this.outputs.forEach(output => {
            try {
                output.send(midiData);
                destinations.push(output.name);
            } catch (error) {
                console.error('MIDI send error:', output.name, error);
            }
        });

        return {
            source: null,
            destinations,
            message: midiData
        };
    }

    sendMultipleMessages(messages) {
        const results = [];
        messages.forEach(msg => {
            try {
                results.push(this.sendMidiMessage(msg));
            } catch (error) {
                console.error('Error sending MIDI message:', error);
            }
        });
        return results;
    }


    initializePortStates() {
        if (!this.access) return;
        
        // 全ポートの初期状態を記録
        const allPorts = [...this.access.inputs.values(), ...this.access.outputs.values()];
        allPorts.forEach(port => {
            this.portStates.set(port.id, port.state);
        });
        
        console.log('Initialized port states for', allPorts.length, 'ports');
    }

    handlePortStateChange(event) {
        const { port } = event;
        const portId = port.id;
        const currentState = port.state;
        const previousState = this.portStates.get(portId);

        console.log(`Port state check: ${port.name} (${port.type}) ${previousState} → ${currentState}`);

        // 実際に状態が変わった場合のみ処理
        if (previousState !== currentState) {
            this.portStates.set(portId, currentState);
            this.updateDevices();

            if (currentState === 'connected' && (previousState === 'disconnected' || previousState === undefined)) {
                console.log(`Device connected: ${port.name} (${port.type})`);
                this.dispatchEvent(new CustomEvent('deviceConnected', {
                    detail: { port }
                }));
            } else if (currentState === 'disconnected' && previousState === 'connected') {
                console.log(`Device disconnected: ${port.name} (${port.type})`);
                this.dispatchEvent(new CustomEvent('deviceDisconnected', {
                    detail: { port }
                }));
            }
        } else {
            console.log(`Ignoring duplicate state event: ${port.name} already ${currentState}`);
        }
    }

    cleanup() {
        if (this.access) {
            this.access.removeEventListener('statechange', this.boundHandlePortStateChange);
        }
        this.inputs.forEach(input => {
            if (input.boundHandleMidiMessage) {
                input.removeEventListener('midimessage', input.boundHandleMidiMessage);
            }
        });
        this.inputs = [];
        this.outputs = [];
        this.portStates.clear();
        this.access = null;
        console.log('MIDI resources cleaned up');
    }
}
