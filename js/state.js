/**
 * state.js - Centralized Application State Store
 * Synchronizes with MySQL backend (readings, thresholds, settings, history)
 * with graceful fallback to localStorage when MySQL is in offline simulator mode.
 */

const STORAGE_KEY = 'tempfan_iot_state_v1';

const defaultState = {
  auth: {
    isLoggedIn: false,
    user: null
  },
  temperature: 32.0,
  humidity: null,
  fanStatus: 'ON',
  fanSpeed: 70,
  controlMode: 'Automatic',
  manualFanSpeed: 70,
  thresholds: {
    low: { maxTemp: 30.0, speed: 30 },
    med: { minTemp: 31.0, maxTemp: 35.0, speed: 60 },
    high: { minTemp: 36.0, speed: 100 }
  },
  systemStatus: 'Simulator',
  databaseConnected: false,
  uptimeSeconds: 6 * 3600 + 42 * 60,
  readings: [
    { timeLabel: '12:00 PM', temp: 28.5, speed: 30 },
    { timeLabel: '1:00 PM', temp: 30.0, speed: 30 },
    { timeLabel: '2:00 PM', temp: 29.8, speed: 30 },
    { timeLabel: '2:30 PM', temp: 31.0, speed: 60 },
    { timeLabel: '3:00 PM', temp: 32.5, speed: 60 },
    { timeLabel: '3:30 PM', temp: 30.8, speed: 30 },
    { timeLabel: '4:00 PM', temp: 31.5, speed: 60 },
    { timeLabel: '4:30 PM', temp: 31.2, speed: 60 },
    { timeLabel: '5:00 PM', temp: 30.0, speed: 30 },
    { timeLabel: '5:30 PM', temp: 30.8, speed: 30 },
    { timeLabel: '5:45 PM', temp: 31.4, speed: 60 },
    { timeLabel: '6:00 PM', temp: 32.0, speed: 70 }
  ],
  history: [
    { id: 1, timestamp: '2026-09-25 18:02:00', temperature: 32.0, fanSpeed: 70, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 2, timestamp: '2026-09-25 17:45:00', temperature: 31.8, fanSpeed: 65, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 3, timestamp: '2026-09-25 17:30:00', temperature: 31.2, fanSpeed: 60, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 4, timestamp: '2026-09-25 17:15:00', temperature: 30.5, fanSpeed: 50, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 5, timestamp: '2026-09-25 17:00:00', temperature: 29.8, fanSpeed: 45, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 6, timestamp: '2026-09-25 16:45:00', temperature: 30.2, fanSpeed: 50, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 7, timestamp: '2026-09-25 16:30:00', temperature: 33.1, fanSpeed: 70, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 8, timestamp: '2026-09-25 16:15:00', temperature: 35.4, fanSpeed: 85, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 9, timestamp: '2026-09-25 16:00:00', temperature: 36.5, fanSpeed: 100, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 10, timestamp: '2026-09-25 15:45:00', temperature: 34.0, fanSpeed: 60, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 11, timestamp: '2026-09-25 15:30:00', temperature: 31.0, fanSpeed: 60, fanStatus: 'ON', controlMode: 'Automatic' },
    { id: 12, timestamp: '2026-09-25 15:15:00', temperature: 28.2, fanSpeed: 30, fanStatus: 'ON', controlMode: 'Automatic' }
  ]
};

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();

    // Increment uptime
    setInterval(() => {
      this.state.uptimeSeconds++;
      this.notify('uptime');
    }, 1000);

    // Initial sync with MySQL backend
    this.syncWithBackend();
    // ESP32 telemetry is posted over Wi-Fi, so refresh the shared dashboard state.
    setInterval(() => this.syncWithBackend(), 5000);
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...defaultState, ...parsed };
        // Discard thresholds saved in an incomplete shape so views never read a missing band
        const t = merged.thresholds;
        if (!t || !t.low || !t.med || !t.high) {
          merged.thresholds = JSON.parse(JSON.stringify(defaultState.thresholds));
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load stored state', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to persist state', e);
    }
  }

  get() {
    return this.state;
  }

  update(partial, eventName = 'change') {
    this.state = { ...this.state, ...partial };
    this.saveState();
    this.notify(eventName);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, event);
      } catch (err) {
        console.error('State listener error', err);
      }
    }
  }

  getApiBase() {
    return window.location.pathname.includes('/html') ? '../php/' : 'php/';
  }

  async syncWithBackend() {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      this.update({ databaseConnected: false });
      return;
    }
    const base = this.getApiBase();
    const fetchWithTimeout = async (url, ms = 1800) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const resp = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        return resp;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    try {
      const [readingsRes, threshRes, settsRes] = await Promise.allSettled([
        fetchWithTimeout(base + 'readings.php'),
        fetchWithTimeout(base + 'thresholds.php'),
        fetchWithTimeout(base + 'settings.php')
      ]);

      const updates = {};
      let hasTelemetry = false;

      if (readingsRes.status === 'fulfilled' && readingsRes.value && readingsRes.value.ok) {
        try {
          const data = await readingsRes.value.json();
          if (data.success && data.readings && data.readings.length > 0) {
            const latest = data.latest || data.readings[data.readings.length - 1];
            updates.databaseConnected = true;
            updates.temperature = latest.temp;
            updates.humidity = latest.humidity ?? null;
            updates.fanSpeed = latest.speed;
            updates.fanStatus = latest.status;
            updates.readings = data.readings;
            hasTelemetry = true;
          }
        } catch (_) {}
      }

      if (threshRes.status === 'fulfilled' && threshRes.value && threshRes.value.ok) {
        try {
          const threshData = await threshRes.value.json();
          const t = threshData.thresholds;
          if (threshData.success && t && t.low && t.med && t.high) {
            updates.thresholds = t;
          }
        } catch (_) {}
      }

      if (settsRes.status === 'fulfilled' && settsRes.value && settsRes.value.ok) {
        try {
          const setts = await settsRes.value.json();
          if (setts.success && setts.controlMode) {
            updates.controlMode = setts.controlMode;
            if (setts.manualFanSpeed !== undefined) {
              updates.manualFanSpeed = setts.manualFanSpeed;
            }
            if (setts.systemStatus === 'online') {
              updates.systemStatus = 'Online';
            } else if (!this.serialConnected) {
              // No recent ESP32 telemetry: fall back to the simulator instead of keeping a stale status
              updates.systemStatus = 'Simulator';
            }
          }
        } catch (_) {}
      }

      if (Object.keys(updates).length > 0) {
        this.update(updates, hasTelemetry ? 'telemetry' : 'change');
      }
    } catch (err) {
      this.update({ databaseConnected: false });
    }
  }

  calculateFanState(temp = this.state.temperature) {
    if (this.state.controlMode === 'Manual') {
      const speed = this.state.manualFanSpeed;
      return {
        speed,
        status: speed > 0 ? 'ON' : 'OFF',
        speedLevel: speed <= 35 ? 'Low Speed' : speed <= 70 ? 'Medium Speed' : 'High Speed',
        tempLevel: temp <= this.state.thresholds.low.maxTemp ? 'Normal' : temp <= this.state.thresholds.med.maxTemp ? 'Warm' : 'Hot'
      };
    }

    const { low, med, high } = this.state.thresholds;
    let speed = low.speed;
    let speedLevel = 'Low Speed';

    if (temp <= low.maxTemp) {
      speed = low.speed;
      speedLevel = 'Low Speed';
    } else if (temp >= med.minTemp && temp <= med.maxTemp) {
      speed = med.speed;
      speedLevel = 'Medium Speed';
    } else {
      speed = high.speed;
      speedLevel = 'High Speed';
    }

    const status = speed > 0 ? 'ON' : 'OFF';
    const tempLevel = temp <= low.maxTemp ? 'Normal' : temp <= med.maxTemp ? 'Warm' : 'Hot';

    return { speed, status, speedLevel, tempLevel };
  }

  recordReading(temp, manualSpeed = null, humidity = null) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const timestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const calculated = this.calculateFanState(temp);
    const speed = manualSpeed !== null ? manualSpeed : calculated.speed;
    const status = speed > 0 ? 'ON' : 'OFF';

    const newReading = { timeLabel, temp: parseFloat(temp.toFixed(1)), speed };
    const newReadings = [...this.state.readings.slice(-11), newReading];

    const newHistoryEntry = {
      id: this.state.history.length > 0 ? Math.max(...this.state.history.map(h => h.id)) + 1 : 1,
      timestamp,
      temperature: parseFloat(temp.toFixed(1)),
      humidity: humidity !== null ? parseFloat(humidity) : this.state.humidity,
      fanSpeed: speed,
      fanStatus: status,
      controlMode: this.state.controlMode
    };

    const newHistory = [newHistoryEntry, ...this.state.history];

    this.update({
      temperature: parseFloat(temp.toFixed(1)),
      humidity: humidity !== null ? parseFloat(humidity) : this.state.humidity,
      fanSpeed: speed,
      fanStatus: status,
      readings: newReadings,
      history: newHistory
    }, 'telemetry');

    // Async sync to MySQL database
    fetch(this.getApiBase() + 'readings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: parseFloat(temp.toFixed(1)),
        humidity: humidity !== null ? parseFloat(humidity) : undefined,
        fanSpeed: speed,
        fanStatus: status,
        controlMode: this.state.controlMode
      })
    }).catch(() => {
      // offline silent catch
    });
  }

  formatUptime() {
    const s = this.state.uptimeSeconds;
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    return `${hours}h ${mins}m since boot`;
  }
}

export const appStore = new Store();
