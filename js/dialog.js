/**
 * dialog.js - Themed modal dialogs replacing the browser's native alert() and confirm()
 */

import { Icons } from './icons.js';

const DIALOG_TYPES = {
  success: { icon: Icons.checkCircle, title: 'Success' },
  error: { icon: Icons.alertTriangle, title: 'Something went wrong' },
  warning: { icon: Icons.alertTriangle, title: 'Please confirm' },
  info: { icon: Icons.info, title: 'Notice' }
};

const CLOSE_ANIMATION_MS = 220;
let dialogCount = 0;

function openDialog({ type = 'info', title, message = '', confirmText = 'OK', cancelText = null }) {
  return new Promise((resolve) => {
    const config = DIALOG_TYPES[type] || DIALOG_TYPES.info;
    const id = `appDialog${++dialogCount}`;
    const previousFocus = document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = `app-dialog-overlay app-dialog-${DIALOG_TYPES[type] ? type : 'info'}`;
    overlay.innerHTML = `
      <div class="app-dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="${id}Title" aria-describedby="${id}Message">
        <button type="button" class="app-dialog-close" aria-label="Close">${Icons.close}</button>
        <div class="app-dialog-icon">${config.icon}</div>
        <h3 class="app-dialog-title" id="${id}Title"></h3>
        <p class="app-dialog-message" id="${id}Message"></p>
        <div class="app-dialog-actions">
          ${cancelText ? '<button type="button" class="app-dialog-btn app-dialog-btn-secondary"></button>' : ''}
          <button type="button" class="app-dialog-btn app-dialog-btn-primary"></button>
        </div>
      </div>
    `;

    const btnConfirm = overlay.querySelector('.app-dialog-btn-primary');
    const btnCancel = overlay.querySelector('.app-dialog-btn-secondary');
    overlay.querySelector('.app-dialog-title').textContent = title || config.title;
    overlay.querySelector('.app-dialog-message').textContent = message;
    btnConfirm.textContent = confirmText;
    if (btnCancel) btnCancel.textContent = cancelText;

    let isClosed = false;

    function close(result) {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', onKeydown, true);
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), CLOSE_ANIMATION_MS);
      if (previousFocus && typeof previousFocus.focus === 'function' && document.contains(previousFocus)) {
        previousFocus.focus();
      }
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
        return;
      }
      // Keep keyboard focus inside the dialog while it is open
      if (e.key === 'Tab') {
        const focusable = Array.from(overlay.querySelectorAll('button'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!overlay.contains(document.activeElement)) {
          e.preventDefault();
          btnConfirm.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    btnConfirm.addEventListener('click', () => close(true));
    if (btnCancel) btnCancel.addEventListener('click', () => close(false));
    overlay.querySelector('.app-dialog-close').addEventListener('click', () => close(false));
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener('keydown', onKeydown, true);

    document.body.appendChild(overlay);
    void overlay.offsetWidth; // Commit the initial styles so the open transition plays
    overlay.classList.add('open');
    btnConfirm.focus();
  });
}

/**
 * Shows a message with a single OK button. Resolves once the dialog is dismissed.
 * options: { type: 'success' | 'error' | 'warning' | 'info', title, message, confirmText }
 */
export function showAlert(options) {
  return openDialog({ ...options, cancelText: null });
}

/**
 * Asks the user to confirm an action. Resolves true when confirmed, false when cancelled.
 * options: { type, title, message, confirmText, cancelText }
 */
export function showConfirm(options) {
  return openDialog({ type: 'warning', confirmText: 'Confirm', ...options, cancelText: options.cancelText || 'Cancel' });
}
