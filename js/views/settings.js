/**
 * views/settings.js - Settings & Threshold Configuration View
 * Source of Truth: Uploaded Reference Image 3 (Top-Right quadrant)
 */

import { Icons } from '../icons.js';
import { appStore } from '../state.js';
import { renderAppShell, attachShellEvents } from './shell.js';
import { showAlert } from '../dialog.js';

export function renderSettings(container, router) {
  const state = appStore.get();
  const isAuto = state.controlMode === 'Automatic';

  const contentHTML = `
    <div class="settings-view">
      <!-- Card 1: Control Mode -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Control Mode</h2>
            <p class="section-desc">Choose how the fan will operate</p>
          </div>
        </div>

        <div class="segmented-mode-switch" id="segmentedModeSwitch">
          <button type="button" class="segment-btn ${isAuto ? 'active' : ''}" data-mode="Automatic" id="btnModeAuto">
            Automatic
          </button>
          <button type="button" class="segment-btn ${!isAuto ? 'active' : ''}" data-mode="Manual" id="btnModeManual">
            Manual
          </button>
        </div>
      </div>

      <!-- Card 2: Temperature Thresholds -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Temperature Thresholds</h2>
            <p class="section-desc">Set the temperature range for each fan speed</p>
          </div>
          <button type="button" class="btn-customize-thresh" id="btnOpenCustomizeModal">
            ${Icons.edit}
            <span>Customize Thresholds</span>
          </button>
        </div>

        <div class="thresholds-grid">
          <!-- Low Speed Card -->
          <div class="threshold-card card-thresh-low">
            <div class="thresh-icon-tile">${Icons.fan}</div>
            <div class="thresh-card-body">
              <span class="thresh-badge-top">Low Speed</span>
              <div class="thresh-temp-range" id="dispThreshLow">
                &le; ${state.thresholds.low.maxTemp.toFixed(0)}°C
              </div>
              <div class="thresh-fan-speed" id="dispSpeedLow">
                Fan: ${state.thresholds.low.speed}%
              </div>
            </div>
          </div>

          <!-- Medium Speed Card -->
          <div class="threshold-card card-thresh-med">
            <div class="thresh-icon-tile">${Icons.sun}</div>
            <div class="thresh-card-body">
              <span class="thresh-badge-top">Medium Speed</span>
              <div class="thresh-temp-range" id="dispThreshMed">
                ${state.thresholds.med.minTemp.toFixed(0)}°C – ${state.thresholds.med.maxTemp.toFixed(0)}°C
              </div>
              <div class="thresh-fan-speed" id="dispSpeedMed">
                Fan: ${state.thresholds.med.speed}%
              </div>
            </div>
          </div>

          <!-- High Speed Card -->
          <div class="threshold-card card-thresh-high">
            <div class="thresh-icon-tile">${Icons.flame}</div>
            <div class="thresh-card-body">
              <span class="thresh-badge-top">High Speed</span>
              <div class="thresh-temp-range" id="dispThreshHigh">
                &ge; ${state.thresholds.high.minTemp.toFixed(0)}°C
              </div>
              <div class="thresh-fan-speed" id="dispSpeedHigh">
                Fan: ${state.thresholds.high.speed}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Manual Fan Control -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Manual Fan Control</h2>
            <p class="section-desc" id="manualNoticeText">
              ${isAuto ? 'Adjust fan speed manually (Manual mode only — currently disabled)' : 'Adjust fan speed manually (Active in Manual mode)'}
            </p>
          </div>
          <span class="manual-slider-value" id="manualSliderLabel">
            ${state.manualFanSpeed}%
          </span>
        </div>

        <div class="slider-control-wrap">
          <input
            type="range"
            id="manualFanSlider"
            class="range-slider"
            min="0"
            max="100"
            value="${state.manualFanSpeed}"
            style="--fill: ${state.manualFanSpeed}%;"
            aria-label="Manual fan speed"
            ${isAuto ? 'disabled' : ''}
          />
          <div class="slider-ticks-row">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- Save Settings Action Button -->
      <div class="save-settings-row">
        <button type="button" class="btn-save-settings" id="btnSaveAllSettings">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Settings</span>
        </button>
      </div>
    </div>

    <!-- Modal for Customizing Thresholds -->
    <div class="modal-overlay" id="threshModal">
      <div class="modal-content-card">
        <div class="modal-header-row">
          <h3 class="modal-title">Customize Temperature Thresholds</h3>
          <button type="button" class="btn-modal-close" id="btnCloseThreshModal" aria-label="Close">&times;</button>
        </div>
        <div class="thresh-desc">
          Configure the temperature boundaries and fan speeds for Low, Medium, and High cooling levels.
        </div>

        <form id="threshForm">
          <div class="thresh-sections">
            <!-- Low Threshold -->
            <div class="thresh-section thresh-low">
              <div class="thresh-section-title">Low Speed Range</div>
              <div class="thresh-fields">
                <div class="thresh-field">
                  <label for="inpLowMax">Max Temp (°C)</label>
                  <input type="number" id="inpLowMax" class="input-light" value="${state.thresholds.low.maxTemp}" step="0.5">
                </div>
                <div class="thresh-field">
                  <label for="inpLowSpeed">Fan Speed (%)</label>
                  <input type="number" id="inpLowSpeed" class="input-light" value="${state.thresholds.low.speed}" min="0" max="100">
                </div>
              </div>
            </div>

            <!-- Medium Threshold -->
            <div class="thresh-section thresh-medium">
              <div class="thresh-section-title">Medium Speed Range</div>
              <div class="thresh-fields thresh-fields-3">
                <div class="thresh-field">
                  <label for="inpMedMin">Min Temp (°C)</label>
                  <input type="number" id="inpMedMin" class="input-light" value="${state.thresholds.med.minTemp}" step="0.5">
                </div>
                <div class="thresh-field">
                  <label for="inpMedMax">Max Temp (°C)</label>
                  <input type="number" id="inpMedMax" class="input-light" value="${state.thresholds.med.maxTemp}" step="0.5">
                </div>
                <div class="thresh-field">
                  <label for="inpMedSpeed">Speed (%)</label>
                  <input type="number" id="inpMedSpeed" class="input-light" value="${state.thresholds.med.speed}" min="0" max="100">
                </div>
              </div>
            </div>

            <!-- High Threshold -->
            <div class="thresh-section thresh-high">
              <div class="thresh-section-title">High Speed Range</div>
              <div class="thresh-fields">
                <div class="thresh-field">
                  <label for="inpHighMin">Min Temp (°C)</label>
                  <input type="number" id="inpHighMin" class="input-light" value="${state.thresholds.high.minTemp}" step="0.5">
                </div>
                <div class="thresh-field">
                  <label for="inpHighSpeed">Fan Speed (%)</label>
                  <input type="number" id="inpHighSpeed" class="input-light" value="${state.thresholds.high.speed}" min="0" max="100">
                </div>
              </div>
            </div>

            <div id="threshValidationError" class="thresh-error" style="display: none;"></div>
          </div>

          <div class="thresh-actions">
            <button type="button" class="btn-filter-outline" id="btnCancelThreshModal">Cancel</button>
            <button type="submit" class="btn-filter-primary">Apply Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  container.innerHTML = renderAppShell(
    '/settings',
    'Settings',
    'Configure fan control and temperature thresholds',
    contentHTML,
    router
  );

  const cleanupShell = attachShellEvents(container, router);

  // Mode Toggle logic
  const btnAuto = container.querySelector('#btnModeAuto');
  const btnManual = container.querySelector('#btnModeManual');
  const slider = container.querySelector('#manualFanSlider');
  const notice = container.querySelector('#manualNoticeText');
  let currentMode = state.controlMode;
  let currentSpeed = state.manualFanSpeed;

  btnAuto.addEventListener('click', () => {
    currentMode = 'Automatic';
    btnAuto.classList.add('active');
    btnManual.classList.remove('active');
    slider.disabled = true;
    notice.textContent = 'Adjust fan speed manually (Manual mode only — currently disabled)';
  });

  btnManual.addEventListener('click', () => {
    currentMode = 'Manual';
    btnManual.classList.add('active');
    btnAuto.classList.remove('active');
    slider.disabled = false;
    notice.textContent = 'Adjust fan speed manually (Active in Manual mode)';
  });

  slider.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value, 10);
    slider.style.setProperty('--fill', `${currentSpeed}%`);
    container.querySelector('#manualSliderLabel').textContent = `${currentSpeed}%`;
  });

  // Threshold Modal logic
  const modal = container.querySelector('#threshModal');
  const btnOpenModal = container.querySelector('#btnOpenCustomizeModal');
  const btnCloseModal = container.querySelector('#btnCloseThreshModal');
  const btnCancelModal = container.querySelector('#btnCancelThreshModal');
  const formThresh = container.querySelector('#threshForm');
  const errThresh = container.querySelector('#threshValidationError');

  // The page shell keeps a transform from its enter animation, which would trap a fixed overlay
  // inside the page instead of the viewport, so the modal lives on <body> while this view is open.
  document.body.appendChild(modal);

  btnOpenModal.addEventListener('click', () => modal.classList.add('open'));
  const closeModal = () => {
    modal.classList.remove('open');
    errThresh.style.display = 'none';
  };
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  formThresh.addEventListener('submit', (e) => {
    e.preventDefault();
    const lowMax = parseFloat(modal.querySelector('#inpLowMax').value);
    const lowSpd = parseInt(modal.querySelector('#inpLowSpeed').value, 10);

    const medMin = parseFloat(modal.querySelector('#inpMedMin').value);
    const medMax = parseFloat(modal.querySelector('#inpMedMax').value);
    const medSpd = parseInt(modal.querySelector('#inpMedSpeed').value, 10);

    const highMin = parseFloat(modal.querySelector('#inpHighMin').value);
    const highSpd = parseInt(modal.querySelector('#inpHighSpeed').value, 10);

    // Validate finite values, fan speed bounds, and non-overlapping temperature bands.
    const numericValues = [lowMax, lowSpd, medMin, medMax, medSpd, highMin, highSpd];
    if (!numericValues.every(Number.isFinite) ||
        [lowSpd, medSpd, highSpd].some(speed => speed < 0 || speed > 100)) {
      errThresh.textContent = 'Enter valid temperatures and fan speeds between 0% and 100%.';
      errThresh.style.display = 'block';
      return;
    }
    if (lowMax >= medMin) {
      errThresh.textContent = 'Validation error: Low Max Temp must be strictly less than Medium Min Temp.';
      errThresh.style.display = 'block';
      return;
    }
    if (medMin >= medMax) {
      errThresh.textContent = 'Validation error: Medium Min Temp must be strictly less than Medium Max Temp.';
      errThresh.style.display = 'block';
      return;
    }
    if (medMax >= highMin) {
      errThresh.textContent = 'Validation error: Medium Max Temp must be strictly less than High Min Temp.';
      errThresh.style.display = 'block';
      return;
    }

    // Update state thresholds
    const newThresholds = {
      low: { maxTemp: lowMax, speed: lowSpd },
      med: { minTemp: medMin, maxTemp: medMax, speed: medSpd },
      high: { minTemp: highMin, speed: highSpd }
    };

    appStore.update({ thresholds: newThresholds });
    fetch((window.location.pathname.includes('/html') ? '../php/' : 'php/') + 'thresholds.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholds: newThresholds })
    }).catch(() => {});

    // Update displays on page
    container.querySelector('#dispThreshLow').innerHTML = `&le; ${lowMax.toFixed(0)}°C`;
    container.querySelector('#dispSpeedLow').textContent = `Fan: ${lowSpd}%`;
    container.querySelector('#dispThreshMed').textContent = `${medMin.toFixed(0)}°C – ${medMax.toFixed(0)}°C`;
    container.querySelector('#dispSpeedMed').textContent = `Fan: ${medSpd}%`;
    container.querySelector('#dispThreshHigh').innerHTML = `&ge; ${highMin.toFixed(0)}°C`;
    container.querySelector('#dispSpeedHigh').textContent = `Fan: ${highSpd}%`;

    closeModal();
    showAlert({ type: 'success', title: 'Thresholds Updated', message: 'Temperature thresholds updated successfully!' });
  });

  // Save Settings Button
  container.querySelector('#btnSaveAllSettings').addEventListener('click', async () => {
    appStore.update({
      controlMode: currentMode,
      manualFanSpeed: currentSpeed
    });

    // Recalculate immediate fan speed
    const calculated = appStore.calculateFanState();
    appStore.update({
      fanSpeed: calculated.speed,
      fanStatus: calculated.status
    });

    const apiBase = window.location.pathname.includes('/html') ? '../php/' : 'php/';
    try {
      const response = await fetch(apiBase + 'settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlMode: currentMode, manualFanSpeed: currentSpeed })
      });
      if (!response.ok) throw new Error('Settings could not be saved to the server.');
    } catch (_) {
      // Keep the saved browser state available when MySQL is offline.
    }

    showAlert({
      type: 'success',
      title: 'Settings Saved',
      message: `Control Mode: ${currentMode}\nFan Speed: ${calculated.speed}%`
    });
  });

  return () => {
    modal.remove();
    cleanupShell();
  };
}
