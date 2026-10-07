/**
 * views/dashboard.js - Dashboard Monitoring View
 * Source of Truth: Uploaded Reference Image 3 (Top-Left quadrant)
 */

import { Icons } from '../icons.js';
import { appStore } from '../state.js';
import { TempTrendChart } from '../chart.js';
import { renderAppShell, attachShellEvents } from './shell.js';

export function renderDashboard(container, router) {
  const state = appStore.get();
  const calculated = appStore.calculateFanState();

  const contentHTML = `
    <div class="dashboard-view">
      <!-- Top Row: 3 Core Metric Cards -->
      <div class="stats-grid-row">
        <!-- Card 1: Current Temperature -->
        <div class="dash-card metric-card">
          <div class="metric-main">
            <div class="card-icon-badge icon-badge-pink">
              ${Icons.thermometer}
            </div>
            <div class="metric-body">
              <span class="card-title-sm">Current Temperature</span>
              <div class="metric-value-row">
                <div class="metric-value-col">
                  <div class="card-value-display">
                    <span id="dashTempDisplay">${state.temperature.toFixed(0)}°C</span>
                  </div>
                  <span class="card-status-badge badge-${calculated.tempLevel.toLowerCase()}" id="dashTempBadge">
                    ${calculated.tempLevel}
                  </span>
                </div>
                <!-- Mini Sparkline decoration -->
                <svg class="mini-sparkline" viewBox="0 0 104 44" fill="none" aria-hidden="true">
                  <path d="M2 34 Q 14 30, 24 31 T 46 24 T 66 26 T 84 14 T 98 10" stroke="#00d2aa" stroke-width="2.5" stroke-linecap="round"/>
                  <circle cx="98" cy="10" r="3.5" fill="#00d2aa"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Fan Status -->
        <div class="dash-card metric-card">
          <div class="metric-main">
            <div class="card-icon-badge icon-badge-teal">
              <div class="${state.fanStatus === 'ON' ? 'spin-active' : ''}" id="dashFanSpinIcon" style="display:flex; animation-duration: ${Math.max(0.4, 2.5 - (state.fanSpeed / 50))}s;">
                ${Icons.fan}
              </div>
            </div>
            <div class="metric-body">
              <span class="card-title-sm">Fan Status</span>
              <div class="card-value-display ${state.fanStatus === 'ON' ? 'is-on' : 'is-off'}" id="dashFanStatusValue">
                <span id="dashFanStatusText">${state.fanStatus}</span>
              </div>
              <div class="card-subtext">Adjusting speed based on temperature</div>
            </div>
          </div>
        </div>

        <!-- Card 3: Fan Speed -->
        <div class="dash-card metric-card">
          <div class="metric-main">
            <div class="card-icon-badge icon-badge-green">
              ${Icons.speedometer}
            </div>
            <div class="metric-body">
              <span class="card-title-sm">Fan Speed</span>
              <div class="card-value-display">
                <span id="dashFanSpeedText">${state.fanSpeed}%</span>
              </div>
            </div>
          </div>
          <div class="speed-progress-wrap">
            <div class="progress-track">
              <div class="progress-bar-fill" id="dashSpeedBar" style="width: ${state.fanSpeed}%;"></div>
            </div>
            <div class="speed-labels-row">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Second Row: 3 Operational Status Cards -->
      <div class="stats-grid-row">
        <!-- Card 4: Energy Efficient -->
        <div class="dash-card status-card">
          <div class="card-icon-badge icon-badge-green">
            ${Icons.lightning}
          </div>
          <div class="status-body">
            <span class="status-title">Energy Efficient</span>
            <span class="card-subtext">Runs only when needed</span>
          </div>
        </div>

        <!-- Card 5: Automatic Control -->
        <div class="dash-card status-card">
          <div class="card-icon-badge icon-badge-purple">
            ${Icons.clock}
          </div>
          <div class="status-body">
            <span class="status-title" id="dashControlModeValue">${state.controlMode} Control</span>
            <span class="card-subtext">Real-time adjustment</span>
          </div>
        </div>

        <!-- Card 6: System Uptime -->
        <div class="dash-card status-card">
          <div class="card-icon-badge icon-badge-amber">
            ${Icons.monitor}
          </div>
          <div class="status-body">
            <span class="status-title">System Uptime</span>
            <span class="card-subtext" id="dashUptimeDisplay">${appStore.formatUptime()}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Temperature Trend Chart -->
      <div class="trend-chart-card">
        <div class="trend-header-row">
          <h2 class="trend-title">Temperature Trend</h2>
          <span class="trend-badge-sub">Last 12 readings</span>
        </div>
        <div class="chart-canvas-container">
          <canvas id="tempTrendChart"></canvas>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = renderAppShell(
    '/dashboard',
    'Dashboard',
    'Real-time temperature monitoring and fan status',
    contentHTML,
    router
  );

  const cleanupShell = attachShellEvents(container, router);

  // Initialize Canvas Chart
  const chart = new TempTrendChart('tempTrendChart');
  chart.render(state.readings);

  // Subscribe to live state updates
  const unsubscribe = appStore.subscribe((newState, event) => {
    // Update live elements
    const tempEl = container.querySelector('#dashTempDisplay');
    const badgeEl = container.querySelector('#dashTempBadge');
    const fanStatusEl = container.querySelector('#dashFanStatusText');
    const fanSpeedEl = container.querySelector('#dashFanSpeedText');
    const speedBar = container.querySelector('#dashSpeedBar');
    const fanIcon = container.querySelector('#dashFanSpinIcon');
    const uptimeEl = container.querySelector('#dashUptimeDisplay');
    const modeEl = container.querySelector('#dashControlModeValue');

    if (uptimeEl) uptimeEl.textContent = appStore.formatUptime();

    if (event === 'telemetry' || event === 'change') {
      const calc = appStore.calculateFanState();
      if (tempEl) tempEl.textContent = `${newState.temperature.toFixed(0)}°C`;
      if (badgeEl) {
        badgeEl.textContent = calc.tempLevel;
        badgeEl.className = `card-status-badge badge-${calc.tempLevel.toLowerCase()}`;
      }
      if (fanStatusEl) {
        fanStatusEl.textContent = newState.fanStatus;
        fanStatusEl.parentElement.className = `card-value-display ${newState.fanStatus === 'ON' ? 'is-on' : 'is-off'}`;
      }
      if (fanSpeedEl) fanSpeedEl.textContent = `${newState.fanSpeed}%`;
      if (speedBar) speedBar.style.width = `${newState.fanSpeed}%`;
      if (fanIcon) {
        fanIcon.className = newState.fanStatus === 'ON' ? 'spin-active' : '';
        fanIcon.style.animationDuration = `${Math.max(0.4, 2.5 - (newState.fanSpeed / 50))}s`;
      }
      if (modeEl) modeEl.textContent = `${newState.controlMode} Control`;

      // Update Chart
      chart.render(newState.readings);
    }
  });

  return () => {
    unsubscribe();
    cleanupShell();
  };
}
