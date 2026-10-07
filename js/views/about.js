/**
 * views/about.js - About Project & Hardware System Architecture View
 * Source of Truth: Uploaded Reference Image 3 (Bottom-Right quadrant) & Official Documentation
 */

import { Icons } from '../icons.js';
import { renderAppShell, attachShellEvents } from './shell.js';

export function renderAbout(container, router) {
  const contentHTML = `
    <div class="about-view">
    <!-- Top Hero Card: Project Identity -->
    <div class="about-hero-card">
      <div class="about-logo-sq">
        ${Icons.logo}
      </div>
      <div class="about-hero-body">
        <h2 class="about-hero-title">TempFan</h2>
        <div class="about-hero-sub">Temperature-Based Automatic Fan Speed Control System</div>
        <p class="about-hero-desc">
          A smart fan control system that automatically adjusts the fan speed based on real-time temperature using a microcontroller and sensor. Designed for energy efficiency and proactive climate regulation in households, student dorms, and work environments.
        </p>
      </div>
    </div>

    <!-- 2-Column Grid: Contributors & System Specifications -->
    <div class="about-two-col-grid">
      <!-- Card Left: Project Contributors -->
      <div class="info-card about-reference-card">
        <div class="info-card-header">
          ${Icons.gear}
          <h3 class="info-card-title">Project Contributors</h3>
        </div>

        <div class="contributors-list">
          <div class="contributor-item">
            <div class="contributor-avatar">${Icons.user}</div>
            <div>
              <div class="contributor-name">Jenalyn Ytac</div>
            </div>
          </div>

          <div class="contributor-item">
            <div class="contributor-avatar">${Icons.user}</div>
            <div>
              <div class="contributor-name">Jelyn Mabras</div>
            </div>
          </div>

          <div class="contributor-item">
            <div class="contributor-avatar">${Icons.user}</div>
            <div>
              <div class="contributor-name">Jhon Louie Sanrojo</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Right: System Information -->
      <div class="info-card about-reference-card">
        <div class="info-card-header">
          ${Icons.monitor}
          <h3 class="info-card-title">System Information</h3>
        </div>

        <table class="system-specs-table">
          <tbody>
            <tr>
              <td class="spec-key">Platform</td>
              <td class="spec-value">ESP32 Development Board</td>
            </tr>
            <tr>
              <td class="spec-key">Control Mode</td>
              <td class="spec-value">Automatic (Temperature Driven)</td>
            </tr>
            <tr>
              <td class="spec-key">Sensor</td>
              <td class="spec-value" style="color: var(--primary); font-weight: 800;">DHT11 Temperature &amp; Humidity Sensor</td>
            </tr>
            <tr>
              <td class="spec-key">Firmware Version</td>
              <td class="spec-value">1.0.0 (Production Release)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hardware System Architecture & Signal Flow -->
    <div class="circuit-flow-card">
      <div class="info-card-header" style="border: none; padding-bottom: 0;">
        ${Icons.lightning}
        <h3 class="info-card-title">Hardware Signal Flow Architecture</h3>
      </div>
      <p class="circuit-flow-desc">
        Linear telemetry and actuation pipeline from sensor transducer to PWM motor output:
      </p>

      <div class="circuit-steps-flow">
        <div class="flow-step-box">
          <div class="flow-step-icon">${Icons.thermometer}</div>
          <div class="flow-step-title">1. DHT11 Sensor</div>
          <div class="flow-step-sub">Digital temperature and humidity telemetry</div>
        </div>

        <div class="flow-step-box">
          <div class="flow-step-icon">${Icons.monitor}</div>
          <div class="flow-step-title">2. ESP32</div>
          <div class="flow-step-sub">Wi-Fi telemetry and PWM control logic</div>
        </div>

        <div class="flow-step-box">
          <div class="flow-step-icon">${Icons.gear}</div>
          <div class="flow-step-title">3. 1kΩ &amp; 2N2222</div>
          <div class="flow-step-sub">PWM base-current amplification (GPIO 18)</div>
        </div>

        <div class="flow-step-box">
          <div class="flow-step-icon">${Icons.lightning}</div>
          <div class="flow-step-title">4. 1N4007 Diode</div>
          <div class="flow-step-sub">Flyback surge clamping protection</div>
        </div>

        <div class="flow-step-box">
          <div class="flow-step-icon">${Icons.fan}</div>
          <div class="flow-step-title">5. DC Fan Motor</div>
          <div class="flow-step-sub">Dynamic RPM cooling airflow</div>
        </div>
      </div>
    </div>

    <!-- Bottom Banner -->
    <div class="about-bottom-banner">
      <div class="banner-left">
        <span class="banner-icon">${Icons.leaf}</span>
        <span>Real-time monitoring &amp; temperature regulation</span>
      </div>
      <div class="banner-right">
        <span>Keep your system cool.</span>
        ${Icons.leaf}
      </div>
    </div>
    </div>
  `;

  container.innerHTML = renderAppShell(
    '/about',
    'About',
    'Project information and system details',
    contentHTML,
    router
  );

  return attachShellEvents(container, router);
}
