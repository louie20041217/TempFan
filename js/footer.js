/**
 * footer.js - Shared site footer
 * Used by the public pages (Home, Login, Register) and the app shell (Dashboard, Settings, History, About).
 */

/**
 * variant: 'public' for the dark landing / auth pages, 'app' for the signed-in pages.
 */
export function renderFooter(variant = 'public') {
  const year = new Date().getFullYear();

  return `
    <footer class="site-footer site-footer-${variant === 'app' ? 'app' : 'public'}">
      <div class="site-footer-inner">&copy; ${year} TempFan. All rights reserved.</div>
    </footer>
  `;
}
