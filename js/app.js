/**
 * app.js - Main Application Orchestrator
 * Bootstraps Router, State, Simulator, and Views
 */

import { Router } from './router.js';

import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderDashboard } from './views/dashboard.js';
import { renderSettings } from './views/settings.js';
import { renderHistory } from './views/history.js';
import { renderAbout } from './views/about.js';
import { renderProfile } from './views/profile.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.currentCleanup = null;

    this.routes = {
      '/': { render: renderHome, protected: false, title: 'TempFan - Auto Fan Control' },
      '/login': { render: renderLogin, protected: false, title: 'TempFan - Login' },
      '/register': { render: renderRegister, protected: false, title: 'TempFan - Sign Up' },
      '/dashboard': { render: renderDashboard, protected: true, title: 'TempFan - Dashboard' },
      '/settings': { render: renderSettings, protected: true, title: 'TempFan - Settings' },
      '/history': { render: renderHistory, protected: true, title: 'TempFan - History' },
      '/about': { render: renderAbout, protected: true, title: 'TempFan - About' },
      '/profile': { render: renderProfile, protected: true, title: 'TempFan - My Profile' }
    };

    this.router = new Router(this.routes, (path, routeConfig) => {
      this.handleNavigation(path, routeConfig);
    });
  }

  init() {
    this.router.init();
  }

  handleNavigation(path, routeConfig) {
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      try {
        this.currentCleanup();
      } catch (e) {
        console.warn('Error during route cleanup', e);
      }
      this.currentCleanup = null;
    }

    document.title = routeConfig.title || 'TempFan - Auto Fan Control';
    window.scrollTo(0, 0);

    // Render View
    this.currentCleanup = routeConfig.render(this.container, this.router);
    const page = this.container.firstElementChild;
    if (page) {
      page.classList.remove('page-enter');
      requestAnimationFrame(() => page.classList.add('page-enter'));
    }
  }
}

// Initialize application with immediate readyState check
function bootstrap() {
  const container = document.getElementById('app');
  if (!container) return;
  const app = new App();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
