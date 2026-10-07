/**
 * views/shell.js - Common Application Shell (Sidebar & Header)
 * Used across Dashboard, Settings, History, and About pages.
 */

import { Icons } from '../icons.js';
import { appStore } from '../state.js';
import { simulator } from '../simulator.js';
import { showAlert } from '../dialog.js';
import { renderFooter } from '../footer.js';

const SIDEBAR_COLLAPSED_KEY = 'tempfan_sidebar_collapsed';
const DRAWER_BREAKPOINT = '(max-width: 991px)';

// Profile photos are stored as small image data URLs; anything else is ignored
export function isSafeAvatar(avatar) {
  return typeof avatar === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar);
}

function isSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function renderAppShell(activeRoute, pageTitle, pageSubtitle, contentHTML, router) {
  const state = appStore.get();
  const authUser = (state.auth && state.auth.user) || {};
  const avatarImg = isSafeAvatar(authUser.avatar) ? `<img class="avatar-img" src="${authUser.avatar}" alt="">` : '';
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return `
    <div class="app-shell ${isSidebarCollapsed() ? 'sidebar-collapsed' : ''}" id="appShell">
      <!-- Mobile Drawer Backdrop -->
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

      <!-- Left Sidebar (Responsive on Desktop, Laptop, Tablet, Mobile) -->
      <aside class="app-sidebar" id="appSidebar" role="navigation" aria-label="Main Navigation">
        <div class="sidebar-top-container">
          <!-- Sidebar Header: Brand & Mobile/Tablet Close Button -->
          <div class="sidebar-header">
            <div class="sidebar-brand" id="sidebarBrandClick" title="TempFan - Auto Fan Control">
              <div class="brand-icon-clover" style="color: var(--primary-glow);">
                ${Icons.logo}
              </div>
              <div class="sidebar-brand-text">
                <span class="sidebar-brand-title">TempFan</span>
                <span class="sidebar-brand-sub">Auto Fan Control</span>
              </div>
            </div>
            <button class="btn-sidebar-close" id="btnSidebarClose" aria-label="Close navigation menu" title="Close menu">
              ${Icons.close}
            </button>
          </div>

          <!-- Mobile / Tablet Drawer User Card -->
          <div class="sidebar-user-card" id="sidebarUserCard">
            <div class="sidebar-user-avatar">
              ${avatarImg || ((state.auth && state.auth.user && state.auth.user.name) ? state.auth.user.name.charAt(0).toUpperCase() : 'A')}
            </div>
            <div class="sidebar-user-info">
              <span class="sidebar-user-name">${(state.auth && state.auth.user) ? state.auth.user.name : 'System Admin'}</span>
              <span class="sidebar-user-role">${(state.auth && state.auth.user) ? state.auth.user.role : 'IoT Engineer'}</span>
            </div>
            <button class="btn-sidebar-logout" id="btnSidebarLogout" title="Log Out" aria-label="Log Out">
              ${Icons.login}
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="sidebar-nav-wrap">
            <ul class="sidebar-nav">
              <li>
                <a href="#/dashboard" class="nav-link-item ${activeRoute === '/dashboard' ? 'active' : ''}" data-nav="/dashboard">
                  <span class="nav-icon-wrap">${Icons.home}</span>
                  <span class="nav-label">Dashboard</span>
                  <span class="nav-active-pill"></span>
                </a>
              </li>
              <li>
                <a href="#/settings" class="nav-link-item ${activeRoute === '/settings' ? 'active' : ''}" data-nav="/settings">
                  <span class="nav-icon-wrap">${Icons.gear}</span>
                  <span class="nav-label">Settings</span>
                  <span class="nav-active-pill"></span>
                </a>
              </li>
              <li>
                <a href="#/history" class="nav-link-item ${activeRoute === '/history' ? 'active' : ''}" data-nav="/history">
                  <span class="nav-icon-wrap">${Icons.history}</span>
                  <span class="nav-label">History</span>
                  <span class="nav-active-pill"></span>
                </a>
              </li>
              <li>
                <a href="#/about" class="nav-link-item ${activeRoute === '/about' ? 'active' : ''}" data-nav="/about">
                  <span class="nav-icon-wrap">${Icons.info}</span>
                  <span class="nav-label">About</span>
                  <span class="nav-active-pill"></span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Sidebar Bottom Logout Button -->
        <button type="button" class="sidebar-status-box sidebar-logout-action" id="sidebarStatusBox" title="Log Out" aria-label="Log Out">
          <span class="sidebar-logout-icon">${Icons.login}</span>
          <span class="sidebar-logout-copy">
            <span class="sidebar-logout-label">Log Out</span>
            <span class="sidebar-logout-subtitle">End your current session</span>
          </span>
          <span class="sidebar-logout-exit">EXIT <span aria-hidden="true">›</span></span>
        </button>
      </aside>

      <!-- Main Content Area -->
      <div class="app-main">
        <!-- Top App Header -->
        <header class="app-header">
          <div class="header-left">
            <button type="button" class="btn-hamburger" id="btnSidebarToggle" aria-label="Toggle Navigation Menu" aria-controls="appSidebar" title="Toggle menu">
              ${Icons.hamburger}
            </button>
            <div class="header-titles">
              <h1 class="header-page-title">${pageTitle}</h1>
              <p class="header-page-sub">${pageSubtitle}</p>
            </div>
          </div>

          <div class="header-right">
            <!-- Hardware Simulator Status Pill -->
            <button class="badge-simulator-pill active-pulse" id="btnToggleSimModal" title="Configure Hardware Simulator">
              <span>${state.systemStatus === 'Online' ? 'ESP32 Wi-Fi Active' : 'Hardware Simulator'}</span>
            </button>

            <!-- Live Date Time -->
            <div class="header-datetime" id="headerLiveClock">${dateFormatted}</div>

            <!-- Profile Avatar Menu -->
            <div class="user-profile-menu-wrap">
              <button type="button" class="btn-user-avatar" id="btnUserMenuToggle" aria-label="User Profile" aria-haspopup="true" aria-expanded="false" aria-controls="profileDropdownMenu">
                ${avatarImg || Icons.user}
              </button>

              <div class="profile-dropdown" id="profileDropdownMenu">
                <div class="profile-header-info">
                  <div class="profile-header-avatar" aria-hidden="true">${avatarImg || state.auth.user.name.charAt(0).toUpperCase()}</div>
                  <div class="profile-header-text">
                    <div class="profile-name">${state.auth.user.name}</div>
                    <div class="profile-role">${state.auth.user.role}</div>
                  </div>
                </div>
                <a href="#/profile" class="dropdown-item" id="btnOpenProfile">
                  <span class="dropdown-item-icon">${Icons.user}</span>
                  <span>My Profile</span>
                </a>
                <button type="button" class="dropdown-item" id="btnOpenConnectSerial">
                  <span class="dropdown-item-icon">${Icons.monitor}</span>
                  <span>Connect ESP32 via USB</span>
                </button>
                <button type="button" class="dropdown-item" id="btnTriggerQuickSim">
                  <span class="dropdown-item-icon">${Icons.thermometer}</span>
                  <span>Quick Temp Test</span>
                </button>
                <div class="dropdown-divider" role="separator"></div>
                <button type="button" class="dropdown-item item-danger" id="btnLogoutAction">
                  <span class="dropdown-item-icon">${Icons.login}</span>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Page View Injected Here -->
        <div class="page-content-wrapper">
          ${contentHTML}
        </div>

        ${renderFooter('app')}
      </div>
    </div>

    <!-- Floating Simulator Control Bar -->
    <div class="floating-sim-bar" id="floatingSimBar">
      <span class="sim-label">
        <span style="font-size: 1.1rem;">⚡</span>
        <span>Hardware Simulator:</span>
      </span>
      <button class="btn-sim-quick" data-temp="28.0">Low (28°C)</button>
      <button class="btn-sim-quick" data-temp="33.0">Med (33°C)</button>
      <button class="btn-sim-quick" data-temp="37.5">High (37.5°C)</button>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 0.8rem; color: #8da49c;">Custom:</span>
        <input type="number" id="quickSimTempInput" class="sim-temp-input" value="${state.temperature.toFixed(1)}" step="0.5" min="15" max="50">
        <span style="font-size: 0.8rem; color: #8da49c;">°C</span>
        <button class="btn-sim-quick" id="btnApplyCustomTemp">Apply</button>
      </div>
    </div>
  `;
}

export function attachShellEvents(container, router) {
  // Mobile / Tablet Sidebar Drawer Elements
  const sidebar = container.querySelector('#appSidebar');
  const backdrop = container.querySelector('#sidebarBackdrop');
  const btnToggle = container.querySelector('#btnSidebarToggle');
  const btnClose = container.querySelector('#btnSidebarClose');
  const btnSidebarLogout = container.querySelector('#btnSidebarLogout');

  function openDrawer() {
    if (sidebar) sidebar.classList.add('drawer-open');
    if (backdrop) backdrop.classList.add('show');
    document.body.classList.add('sidebar-drawer-active');
  }

  function closeDrawer() {
    if (sidebar) sidebar.classList.remove('drawer-open');
    if (backdrop) backdrop.classList.remove('show');
    document.body.classList.remove('sidebar-drawer-active');
  }

  // Desktop & laptop: the hamburger collapses / expands the sidebar and remembers the choice
  const shell = container.querySelector('#appShell');
  let resizeTimer = null;

  function toggleSidebarCollapsed() {
    if (!shell) return;
    const collapsed = shell.classList.toggle('sidebar-collapsed');
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch (_) {
      // The toggle still works for this page view without storage.
    }
    // Let charts and other width-dependent elements re-measure once the slide finishes
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
  }

  function toggleSidebar() {
    if (window.matchMedia(DRAWER_BREAKPOINT).matches) {
      if (sidebar && sidebar.classList.contains('drawer-open')) closeDrawer();
      else openDrawer();
    } else {
      toggleSidebarCollapsed();
    }
  }

  if (btnToggle) btnToggle.addEventListener('click', toggleSidebar);
  if (btnClose) btnClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Close drawer when pressing Escape
  const onKeyDown = (e) => {
    if (e.key !== 'Escape') return;
    if (sidebar && sidebar.classList.contains('drawer-open')) closeDrawer();
    const profileMenu = container.querySelector('#profileDropdownMenu');
    if (profileMenu && profileMenu.classList.contains('open')) {
      profileMenu.classList.remove('open');
      const profileToggle = container.querySelector('#btnUserMenuToggle');
      if (profileToggle) {
        profileToggle.setAttribute('aria-expanded', 'false');
        profileToggle.focus();
      }
    }
  };
  document.addEventListener('keydown', onKeyDown);

  // Close drawer on nav item click on mobile/tablet
  container.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      const target = link.getAttribute('data-nav');
      if (target) router.navigate(target);
    });
  });

  // Drawer Logout button
  if (btnSidebarLogout) {
    btnSidebarLogout.addEventListener('click', () => {
      closeDrawer();
      appStore.update({
        auth: { isLoggedIn: false, user: null }
      });
      router.navigate('/login');
    });
  }

  // Brand click goes to Dashboard or Home
  const brand = container.querySelector('#sidebarBrandClick');
  if (brand) {
    brand.addEventListener('click', () => {
      closeDrawer();
      router.navigate('/dashboard');
    });
  }

  // Profile dropdown in desktop header
  const avatarBtn = container.querySelector('#btnUserMenuToggle');
  const dropdown = container.querySelector('#profileDropdownMenu');
  const closeProfileDropdown = () => {
    if (dropdown) dropdown.classList.remove('open');
    if (avatarBtn) avatarBtn.setAttribute('aria-expanded', 'false');
  };
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      avatarBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', closeProfileDropdown);
  }

  // Header Logout
  const logoutBtn = container.querySelector('#btnLogoutAction');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      appStore.update({
        auth: { isLoggedIn: false, user: null }
      });
      router.navigate('/login');
    });
  }

  // Live Clock updater
  const clockEl = container.querySelector('#headerLiveClock');
  const clockTimer = setInterval(() => {
    if (!clockEl || !document.body.contains(clockEl)) {
      clearInterval(clockTimer);
      return;
    }
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, 1000);

  // Reactive subscription for Sidebar dynamic elements (chips & status box)
  const sidebarTemp = container.querySelector('#sidebarLiveTemp');
  const sidebarMode = container.querySelector('#sidebarLiveMode');
  
  const unsubscribeStore = appStore.subscribe((state) => {
    if (sidebarTemp) sidebarTemp.textContent = `${state.temperature.toFixed(1)}°C`;
    if (sidebarMode) sidebarMode.textContent = state.controlMode;
  });

  // Floating Simulator Bar actions
  container.querySelectorAll('.btn-sim-quick[data-temp]').forEach(btn => {
    btn.addEventListener('click', () => {
      const temp = parseFloat(btn.getAttribute('data-temp'));
      simulator.setTemperature(temp);
    });
  });

  const btnApply = container.querySelector('#btnApplyCustomTemp');
  const inputTemp = container.querySelector('#quickSimTempInput');
  if (btnApply && inputTemp) {
    btnApply.addEventListener('click', () => {
      const temp = parseFloat(inputTemp.value);
      if (!isNaN(temp)) simulator.setTemperature(temp);
    });
  }

  // Quick Temp Test: jump to the simulator bar so a test temperature can be typed and applied
  const btnQuickSim = container.querySelector('#btnTriggerQuickSim');
  const simBar = container.querySelector('#floatingSimBar');
  if (btnQuickSim && inputTemp) {
    btnQuickSim.addEventListener('click', () => {
      inputTemp.focus();
      inputTemp.select();
      if (simBar) {
        simBar.classList.remove('sim-bar-highlight');
        void simBar.offsetWidth; // Restart the highlight animation
        simBar.classList.add('sim-bar-highlight');
      }
    });
  }

  // Web Serial Connect Action
  const btnConnectSerial = container.querySelector('#btnOpenConnectSerial');
  if (btnConnectSerial) {
    btnConnectSerial.addEventListener('click', async () => {
      try {
        await simulator.connectPhysicalESP32();
        showAlert({ type: 'success', title: 'ESP32 Connected', message: 'Successfully connected to the ESP32 USB serial monitor. ESP32 telemetry is sent to this dashboard over Wi-Fi.' });
      } catch (e) {
        showAlert({ type: 'error', title: 'Connection Failed', message: e.message || 'Could not connect to USB Serial device.' });
      }
    });
  }

  const btnSimModal = container.querySelector('#btnToggleSimModal');
  if (btnSimModal) {
    btnSimModal.addEventListener('click', () => {
      const isDrift = simulator.toggleDrift();
      showAlert({
        type: 'info',
        title: 'Hardware Simulator',
        message: `Dynamic Drift Mode: ${isDrift ? 'ACTIVATED (Temperature will periodically drift)' : 'PAUSED (Temperature is holding steady)'}`
      });
    });
  }

  const statusBox = container.querySelector('#sidebarStatusBox');
  if (statusBox) {
    statusBox.addEventListener('click', () => {
      appStore.update({ auth: { isLoggedIn: false, user: null } });
      router.navigate('/login');
    });
  }

  return () => {
    clearInterval(clockTimer);
    clearTimeout(resizeTimer);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('click', closeProfileDropdown);
    document.body.classList.remove('sidebar-drawer-active');
    if (unsubscribeStore) unsubscribeStore();
  };
}
