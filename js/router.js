/**
 * router.js - Client-Side SPA Router with Protected Route Guards
 * Supports hash routing (#/dashboard) and path routing (/dashboard) with fallback.
 */

import { appStore } from './state.js';

export class Router {
  constructor(routes, onNavigate) {
    this.routes = routes;
    this.onNavigate = onNavigate;
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('popstate', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  getRoutePath() {
    let hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      hash = hash.substring(1); // e.g. "/login"
    } else if (hash.startsWith('#')) {
      hash = '/' + hash.substring(1); // e.g. "#login" -> "/login"
    }

    if (hash && hash !== '/') {
      if (hash === '/home' || hash === '/index') return '/';
      return hash;
    }

    // Fallback to pathname inspection
    const path = window.location.pathname;
    if (path.endsWith('/login') || path.endsWith('/login.html')) return '/login';
    if (path.endsWith('/register') || path.endsWith('/register.html')) return '/register';
    if (path.endsWith('/dashboard') || path.endsWith('/dashboard.html')) return '/dashboard';
    if (path.endsWith('/settings') || path.endsWith('/settings.html')) return '/settings';
    if (path.endsWith('/history') || path.endsWith('/history.html')) return '/history';
    if (path.endsWith('/about') || path.endsWith('/about.html')) return '/about';

    return '/';
  }

  navigate(path) {
    const targetHash = '#' + (path.startsWith('/') ? path : '/' + path);
    if (window.location.hash === targetHash) {
      this.handleRoute();
    } else {
      window.location.hash = targetHash;
    }
  }

  handleRoute() {
    let path = this.getRoutePath();
    const routeConfig = this.routes[path] || this.routes['/'];

    // Auth Guard for protected routes (Dashboard, Settings, History, About)
    const state = appStore.get();
    if (routeConfig.protected && !state.auth.isLoggedIn) {
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      } else {
        this.currentRoute = '/login';
        if (this.onNavigate) this.onNavigate('/login', this.routes['/login']);
      }
      return;
    }

    this.currentRoute = path;
    if (this.onNavigate) {
      this.onNavigate(path, routeConfig);
    }
  }
}
