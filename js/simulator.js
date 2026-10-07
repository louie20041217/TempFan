/**
 * simulator.js - Realistic IoT Hardware Simulator & ESP32 USB Diagnostic Driver
 * Simulates DHT11 temperature changes and controls fan speed accordingly.
 */

import { appStore } from './state.js';

export class HardwareSimulator {
  constructor() {
    this.timer = null;
    this.intervalMs = 4000; // New reading every 4 seconds in drift mode
    this.isDrifting = true;
    this.serialPort = null;

    this.startDrift();
  }

  startDrift() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isDrifting) return;
      const state = appStore.get();
      if (state.systemStatus !== 'Simulator') return;

      // Realistic environmental temperature fluctuation
      // Center around 31-33°C with smooth random walks between 27°C and 38°C
      const current = state.temperature;
      let delta = (Math.random() - 0.48) * 0.7; // slight bias upwards/downwards
      let newTemp = Math.round((current + delta) * 10) / 10;

      if (newTemp < 26.5) newTemp = 27.2;
      if (newTemp > 39.0) newTemp = 38.1;

      appStore.recordReading(newTemp);
    }, this.intervalMs);
  }

  setTemperature(temp) {
    const validTemp = parseFloat(temp);
    if (isNaN(validTemp)) return;
    appStore.recordReading(validTemp);
  }

  toggleDrift(enable) {
    this.isDrifting = enable !== undefined ? enable : !this.isDrifting;
    return this.isDrifting;
  }

  // USB serial remains available for ESP32 diagnostics; live telemetry uses Wi-Fi.
  async connectPhysicalESP32() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      this.serialPort = await navigator.serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      appStore.serialConnected = true;
      appStore.update({ systemStatus: 'Online' });

      this.readSerialLoop();
      return true;
    } catch (err) {
      console.error('Serial connection error:', err);
      throw err;
    }
  }

  async readSerialLoop() {
    const textDecoder = new TextDecoderStream();
    this.serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep last incomplete line

          for (const line of lines) {
            this.handleSerialLine(line.trim());
          }
        }
      }
    } catch (err) {
      console.warn('Serial stream interrupted:', err);
    } finally {
      reader.releaseLock();
    }
  }

  handleSerialLine(line) {
    if (!line || !line.startsWith('{')) return;
    try {
      const data = JSON.parse(line);
      if (data.temperature !== undefined) {
        appStore.recordReading(data.temperature, data.fanSpeed, data.humidity);
      }
    } catch (e) {
      // not JSON line
    }
  }
}

export const simulator = new HardwareSimulator();
