/**
 * views/home.js - Home Page View
 * Source of Truth: Uploaded Reference Image 1 (media_1791093751554.jpg) & Official Documentation
 * Complete, interactive, fully functioning landing page with multi-language support,
 * interactive feature inspector modals, and smooth transitions.
 */

import { Icons } from '../icons.js';
import { renderFooter } from '../footer.js';
import { BreezeEffect } from '../breeze.js';

// Multi-language translation dictionary
const TRANSLATIONS = {
  EN: {
    badge: 'IoT-Powered Fan Control',
    title: 'TempFan',
    subtitle: 'Auto Fan Control',
    desc: 'Experience intelligent cooling with automated fan control, powered by IoT — for a smarter, more comfortable space.',
    navHome: 'Home',
    features: {
      auto: 'Auto Fan Control',
      temp: 'Temperature Monitoring',
      energy: 'Energy Efficient',
      wifi: 'Smart Connectivity',
      settings: 'Customizable Settings'
    },
    btnLogin: 'Log In'
  },
  FIL: {
    badge: 'Kontrol ng Bentilador Gamit ang IoT',
    title: 'TempFan',
    subtitle: 'Awtomatikong Kontrol ng Bentilador',
    desc: 'Maranasan ang matalinong pagpapalamig gamit ang awtomatikong kontrol ng bentilador, pinapagana ng IoT para sa mas maginhawang espasyo.',
    navHome: 'Tahanan',
    features: {
      auto: 'Awtomatikong Fan',
      temp: 'Pagsubaybay sa Temp',
      energy: 'Makatipid sa Enerhiya',
      wifi: 'Matalinong Koneksyon',
      settings: 'Mababagong Setting'
    },
    btnLogin: 'Mag-Log In'
  },
  CEB: {
    badge: 'Kontrol sa Bentilador Gamit ang IoT',
    title: 'TempFan',
    subtitle: 'Awtomatikong Kontrol sa Bentilador',
    desc: 'Masinati ang maalamong pagpabugnaw gamit ang awtomatikong kontrol sa bentilador, gipadagan sa IoT alang sa mas komportableng dapit.',
    navHome: 'Panimalay',
    features: {
      auto: 'Awtomatikong Bentilador',
      temp: 'Pagsukod sa Temp',
      energy: 'Makatipid sa Kuryente',
      wifi: 'Maalamong Koneksyon',
      settings: 'Mausab nga Setting'
    },
    btnLogin: 'Sumulod'
  }
};

// Rich technical specifications for all 5 circular features
const FEATURES_DATA = {
  auto: {
    title: 'Automatic Fan Speed Control',
    subtitle: 'Multi-Stage Dynamic PWM Regulation',
    icon: 'fan',
    desc: 'The ESP32 continuously receives ambient temperature from the DHT11 sensor and dynamically scales the DC motor PWM duty-cycle. Low temperature maintains silent low speed; rising heat steps up rotation to deliver comfortable cooling.',
    specs: [
      { label: 'Low Range (≤30°C)', val: '30% Speed' },
      { label: 'Medium Range (31–35°C)', val: '60% Speed' },
      { label: 'High Range (≥36°C)', val: '100% Speed' },
      { label: 'Motor Driver', val: '2N2222 NPN Transistor' }
    ],
    principle: 'ESP32 GPIO 18 provides PWM through the 1kΩ resistor to the 2N2222 base; the 1N4007 diode protects the DC fan from flyback voltage.'
  },
  temp: {
    title: 'Temperature & Humidity Monitoring',
    subtitle: 'DHT11 Digital Sensor Telemetry',
    icon: 'thermometer',
    desc: 'The DHT11 reports ambient temperature and humidity digitally to the ESP32. Temperature, humidity, fan status, and fan speed are logged to the MySQL database through the Wi-Fi telemetry endpoint.',
    specs: [
      { label: 'Sensor Component', val: 'DHT11 Temperature & Humidity Sensor' },
      { label: 'Data Input Pin', val: 'ESP32 GPIO 4' },
      { label: 'Temperature Range', val: '0°C to 50°C' },
      { label: 'Humidity Range', val: '20% to 90% RH' }
    ],
    principle: 'The DHT11 sends a digital reading to the ESP32, which evaluates the temperature thresholds and sends telemetry over Wi-Fi.'
  },
  energy: {
    title: 'Smart Energy Efficiency',
    subtitle: 'Adaptive Duty-Cycle Power Conservation',
    icon: 'leaf',
    desc: 'Standard fans operate at continuous maximum power consumption regardless of room temperature. TempFan eliminates power waste by scaling down motor current when ambient temperatures are moderate.',
    specs: [
      { label: 'Energy Savings', val: 'Up to 45% vs fixed fans' },
      { label: 'Protection Circuit', val: '1N4007 Flyback Diode' },
      { label: 'Idle Current', val: 'Ultra-low standby' },
      { label: 'Component Lifespan', val: 'Significantly extended' }
    ],
    principle: 'Reduces inductive load stress and mechanical wear on DC motor bearings while maximizing kilowatt-hour efficiency.'
  },
  wifi: {
    title: 'Smart Connectivity & IoT Telemetry',
    subtitle: 'ESP32 Wi-Fi & MySQL Telemetry Bridge',
    icon: 'wifi',
    desc: 'The ESP32 posts DHT11 temperature, humidity, fan status, and fan-speed telemetry to the PHP/MySQL backend over the local Wi-Fi network for live monitoring and history.',
    specs: [
      { label: 'Network Protocol', val: 'Wi-Fi HTTP JSON' },
      { label: 'Microcontroller', val: 'ESP32 Development Board' },
      { label: 'Database Engine', val: 'MySQL (tempfan_db)' },
      { label: 'API Endpoints', val: 'PHP PDO Backend' },
      { label: 'Realtime Sync', val: '4000ms polling / push' }
    ],
    principle: 'HTTP JSON telemetry allows the ESP32 and dashboard to share current readings through the MySQL-backed PHP API.'
  },
  settings: {
    title: 'Customizable Settings & Calibration',
    subtitle: 'Personalized Micro-Climate Tuning',
    icon: 'gear',
    desc: 'TempFan allows complete customization of temperature cutoffs and threshold rules. Administrators can switch between Automatic IoT control and Manual fan speed sliders with instant hardware synchronization.',
    specs: [
      { label: 'Default Low', val: 'Max 30.0°C (30% Speed)' },
      { label: 'Default Med', val: '31.0°C - 35.0°C (60% Speed)' },
      { label: 'Default High', val: 'Min 36.0°C (100% Speed)' },
      { label: 'Control Modes', val: 'Automatic / Manual' }
    ],
    principle: 'Threshold parameters are stored in MySQL and used by the ESP32 control logic for automatic PWM fan regulation.'
  }
};

export function renderHome(container, router) {
  let currentLang = localStorage.getItem('tempfan_lang') || 'EN';
  if (!TRANSLATIONS[currentLang]) currentLang = 'EN';
  const t = TRANSLATIONS[currentLang];

  container.innerHTML = `
    <div class="home-page">
      <!-- Fan Background Backdrop (fan_bg.png) -->
      <div class="home-bg-layer"></div>

      <!-- Airflow and Floating Leaves Canvas -->
      <canvas id="homeBreezeCanvas" class="air-flow-canvas"></canvas>

      <!-- Navigation Header -->
      <header class="home-header">
        <div class="brand-logo-wrap" id="homeBrandClick">
          <div class="brand-icon-clover">
            ${Icons.logo}
          </div>
          <span class="brand-title-white">TempFan</span>
        </div>

        <nav class="home-nav" id="homeNavMenu">
          <ul class="home-nav-links">
            <li><a href="#/" class="active" id="navHomeLink">${t.navHome}</a></li>
          </ul>
        </nav>

        <a href="#/login" class="home-header-login" id="btnHeaderLogin">${Icons.user}<span>Log In</span></a>
        <a href="#/register" class="home-header-login" id="btnHeaderRegister">${Icons.userPlus}<span>Register</span></a>
        <div class="lang-selector-wrap home-language-hidden">
          <button class="lang-selector" id="langSelectorBtn" aria-label="Change Language">
            ${Icons.globe}
            <span id="currentLangCode">${currentLang}</span>
            ${Icons.chevronDown}
          </button>

          <div class="lang-dropdown" id="langDropdownMenu">
            <button class="lang-option ${currentLang === 'EN' ? 'active' : ''}" data-lang="EN">
              <span>🇺🇸</span> English (EN)
            </button>
            <button class="lang-option ${currentLang === 'FIL' ? 'active' : ''}" data-lang="FIL">
              <span>🇵🇭</span> Filipino (FIL)
            </button>
            <button class="lang-option ${currentLang === 'CEB' ? 'active' : ''}" data-lang="CEB">
              <span>🇵🇭</span> Cebuano (CEB)
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="home-hero">
        <div class="hero-badge" id="heroBadge">
          ${Icons.wifi}
          <span id="heroBadgeText">${t.badge}</span>
        </div>

        <h1 class="hero-main-title" id="heroMainTitle">${t.title}</h1>
        <h2 class="hero-sub-title" id="heroSubTitle">${t.subtitle}</h2>

        <p class="hero-desc" id="heroDesc">
          ${t.desc}
        </p>

        <!-- 5 Circular Features -->
        <div class="features-row" id="featuresRow">
          <div class="feature-item" data-feature="auto" title="Click to view Auto Fan Control specs">
            <div class="feature-circle-icon">
              ${Icons.fan}
            </div>
            <span class="feature-label" id="featLabelAuto">${t.features.auto}</span>
          </div>

          <div class="feature-item" data-feature="temp" title="Click to view Temperature Monitoring specs">
            <div class="feature-circle-icon">
              ${Icons.thermometer}
            </div>
            <span class="feature-label" id="featLabelTemp">${t.features.temp}</span>
          </div>

          <div class="feature-item" data-feature="energy" title="Click to view Energy Efficiency specs">
            <div class="feature-circle-icon">
              ${Icons.leaf}
            </div>
            <span class="feature-label" id="featLabelEnergy">${t.features.energy}</span>
          </div>

          <div class="feature-item" data-feature="wifi" title="Click to view Smart Connectivity specs">
            <div class="feature-circle-icon">
              ${Icons.wifi}
            </div>
            <span class="feature-label" id="featLabelWifi">${t.features.wifi}</span>
          </div>

          <div class="feature-item" data-feature="settings" title="Click to view Customizable Settings specs">
            <div class="feature-circle-icon">
              ${Icons.gear}
            </div>
            <span class="feature-label" id="featLabelSettings">${t.features.settings}</span>
          </div>
        </div>

        <!-- Login Call To Action -->
        <div class="home-cta-wrap">
          <a href="#/login" class="btn-home-login" id="btnGoToLogin" aria-label="Log in to TempFan">
            ${Icons.login}
            <span id="btnLoginText">${t.btnLogin}</span>
            <span class="home-login-arrow" aria-hidden="true">${Icons.arrowRight}</span>
          </a>
        </div>
      </main>

      ${renderFooter('public')}

      <!-- Feature Inspection Modal -->
      <div class="home-modal-backdrop" id="homeFeatureModal">
        <div class="home-modal-card">
          <button class="btn-modal-close" id="btnCloseFeatureModal" aria-label="Close modal">&times;</button>
          <div class="modal-header-row">
            <div class="modal-header-icon" id="featureModalIcon">
              ${Icons.fan}
            </div>
            <div>
              <h3 class="modal-title" id="featureModalTitle">Auto Fan Control</h3>
              <p class="modal-subtitle" id="featureModalSub">Multi-Stage Dynamic PWM Regulation</p>
            </div>
          </div>

          <div class="modal-body-section">
            <div class="modal-section-title">Overview</div>
            <p class="modal-desc-text" id="featureModalDesc"></p>
          </div>

          <div class="modal-body-section">
            <div class="modal-section-title">Hardware Implementation</div>
            <div class="specs-grid" id="featureModalSpecs"></div>
          </div>

          <div class="modal-body-section">
            <div class="modal-section-title">Operating Principle</div>
            <p class="modal-desc-text" id="featureModalPrinciple" style="font-family: monospace; font-size: 0.85rem; color: var(--primary-glow);"></p>
          </div>

          <div class="modal-actions">
            <button class="btn-modal-primary" id="btnExploreDashboard">
              <span>Open in Dashboard &rarr;</span>
            </button>
            <button class="btn-modal-secondary" id="btnCloseFeatureModalBtn">
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize Canvas Breeze Animation
  const breeze = new BreezeEffect('homeBreezeCanvas');

  // Helper Toast notification
  function showToast(msg) {
    let toast = document.getElementById('tempfan-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tempfan-global-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = 'rgba(6, 38, 30, 0.95)';
      toast.style.border = '1px solid #00e5be';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '12px';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,229,190,0.3)';
      toast.style.zIndex = '9999';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '600';
      toast.style.transition = 'all 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }
    }, 3500);
  }

  // Language update handler
  function applyLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem('tempfan_lang', lang);
    const cur = TRANSLATIONS[lang];

    const langCode = container.querySelector('#currentLangCode');
    if (langCode) langCode.textContent = lang;

    const badge = container.querySelector('#heroBadgeText');
    if (badge) badge.textContent = cur.badge;

    const mainTitle = container.querySelector('#heroMainTitle');
    if (mainTitle) mainTitle.textContent = cur.title;

    const subTitle = container.querySelector('#heroSubTitle');
    if (subTitle) subTitle.textContent = cur.subtitle;

    const desc = container.querySelector('#heroDesc');
    if (desc) desc.textContent = cur.desc;

    const navHome = container.querySelector('#navHomeLink');
    if (navHome) navHome.textContent = cur.navHome;

    const lAuto = container.querySelector('#featLabelAuto');
    if (lAuto) lAuto.textContent = cur.features.auto;

    const lTemp = container.querySelector('#featLabelTemp');
    if (lTemp) lTemp.textContent = cur.features.temp;

    const lEnergy = container.querySelector('#featLabelEnergy');
    if (lEnergy) lEnergy.textContent = cur.features.energy;

    const lWifi = container.querySelector('#featLabelWifi');
    if (lWifi) lWifi.textContent = cur.features.wifi;

    const lSettings = container.querySelector('#featLabelSettings');
    if (lSettings) lSettings.textContent = cur.features.settings;

    const btnLoginTxt = container.querySelector('#btnLoginText');
    if (btnLoginTxt) btnLoginTxt.textContent = cur.btnLogin;

    container.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });

    showToast(`Language set to ${lang === 'EN' ? 'English' : lang === 'FIL' ? 'Filipino' : 'Cebuano'}`);
  }

  // Feature modal inspection logic
  const featureModal = container.querySelector('#homeFeatureModal');
  const featIconEl = container.querySelector('#featureModalIcon');
  const featTitleEl = container.querySelector('#featureModalTitle');
  const featSubEl = container.querySelector('#featureModalSub');
  const featDescEl = container.querySelector('#featureModalDesc');
  const featSpecsEl = container.querySelector('#featureModalSpecs');
  const featPrincipleEl = container.querySelector('#featureModalPrinciple');

  function openFeatureModal(key) {
    const data = FEATURES_DATA[key] || FEATURES_DATA.auto;
    if (featIconEl) featIconEl.innerHTML = Icons[data.icon] || Icons.fan;
    if (featTitleEl) featTitleEl.textContent = data.title;
    if (featSubEl) featSubEl.textContent = data.subtitle;
    if (featDescEl) featDescEl.textContent = data.desc;
    if (featPrincipleEl) featPrincipleEl.textContent = data.principle;

    if (featSpecsEl) {
      featSpecsEl.innerHTML = data.specs.map(s => `
        <div class="spec-cell">
          <div class="spec-cell-label">${s.label}</div>
          <div class="spec-cell-val">${s.val}</div>
        </div>
      `).join('');
    }

    if (featureModal) featureModal.classList.add('open');
  }

  function closeFeatureModal() {
    if (featureModal) featureModal.classList.remove('open');
  }

  // Event Listeners
  // 1. Navigation & Brand
  const brandClick = container.querySelector('#homeBrandClick');
  if (brandClick) {
    brandClick.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.navigate('/');
    });
  }

  const navHome = container.querySelector('#navHomeLink');
  if (navHome) {
    navHome.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.navigate('/');
    });
  }

  // 2. Language Dropdown
  const langBtn = container.querySelector('#langSelectorBtn');
  const langMenu = container.querySelector('#langDropdownMenu');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      langMenu.classList.remove('show');
    });

    container.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        applyLanguage(lang);
        langMenu.classList.remove('show');
      });
    });
  }

  // 3. Feature Circles Click
  container.querySelectorAll('.feature-item').forEach(item => {
    item.addEventListener('click', () => {
      const featKey = item.getAttribute('data-feature');
      openFeatureModal(featKey);
    });
  });

  // Feature modal close triggers
  const btnCloseFeat = container.querySelector('#btnCloseFeatureModal');
  const btnCloseFeat2 = container.querySelector('#btnCloseFeatureModalBtn');
  if (btnCloseFeat) btnCloseFeat.addEventListener('click', closeFeatureModal);
  if (btnCloseFeat2) btnCloseFeat2.addEventListener('click', closeFeatureModal);
  if (featureModal) {
    featureModal.addEventListener('click', (e) => {
      if (e.target === featureModal) closeFeatureModal();
    });
  }

  const btnExploreDash = container.querySelector('#btnExploreDashboard');
  if (btnExploreDash) {
    btnExploreDash.addEventListener('click', () => {
      closeFeatureModal();
      router.navigate('/dashboard');
    });
  }

  // 4. Login CTA Button
  const btnLogin = container.querySelector('#btnGoToLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('/login');
    });
  }

  return () => {
    breeze.destroy();
  };
}
