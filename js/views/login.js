/**
 * views/login.js - Login Page View
 * Source of Truth: Uploaded Reference Image 2 (media_1791093760589.jpg)
 */

import { Icons } from '../icons.js';
import { renderFooter } from '../footer.js';
import { appStore } from '../state.js';

export function renderLogin(container, router) {
  container.innerHTML = `
    <div class="login-page">
      <!-- Fan Background Backdrop -->
      <div class="login-bg-layer"></div>

      <header class="login-topbar">
        <a class="login-topbar-brand" href="#/" aria-label="TempFan home">
          <span class="login-topbar-mark">${Icons.logo}</span>
          <span>TempFan</span>
        </a>
        <nav class="login-topbar-nav" aria-label="Main navigation">
          <a class="login-nav-home" href="#/">Home</a>
          <a class="login-nav-current" href="#/login">${Icons.user}<span>Log In</span></a>
          <a href="#/register">${Icons.userPlus}<span>Register</span></a>
        </nav>
      </header>

      <div class="login-layout">
        <!-- Translucent Login Card -->
        <div class="login-right-content">
          <div class="login-card">
            <div class="login-card-brand">
              <div class="brand-row">
                <div class="brand-icon-clover">
                  ${Icons.logo}
                </div>
                <span class="brand-title-white">TempFan</span>
              </div>
              <span class="brand-tagline">Smart. Cool. Better Living.</span>
            </div>

            <form id="loginForm" novalidate>
              <div id="loginNotice" class="form-error" style="display: none; color: var(--primary-glow);"></div>
              <!-- Input 1: Email or Username -->
              <div class="form-group">
                <div class="input-icon-wrap">
                  <span class="input-icon">${Icons.mail}</span>
                  <input
                    type="text"
                    id="loginIdentifier"
                    class="input-dark"
                    placeholder="Email or username"
                    required
                    autocomplete="username"
                  />
                </div>
                <div id="identifierError" class="form-error" style="display: none;"></div>
              </div>

              <!-- Input 2: Password -->
              <div class="form-group">
                <div class="input-icon-wrap">
                  <span class="input-icon">${Icons.lock}</span>
                  <input
                    type="password"
                    id="loginPassword"
                    class="input-dark"
                    placeholder="Password"
                    required
                    autocomplete="current-password"
                  />
                  <button type="button" class="btn-toggle-pwd" id="btnTogglePassword" aria-label="Toggle password visibility">
                    <span id="pwdEyeIcon">${Icons.eye}</span>
                  </button>
                </div>
                <div id="passwordError" class="form-error" style="display: none;"></div>
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="login-options-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="rememberMeCheckbox" style="display: none;" />
                  <span class="checkbox-custom">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Remember me</span>
                </label>
                <a href="#forgot" id="btnForgotPassword" class="link-teal">Forgot password?</a>
              </div>

              <!-- Main Submit Button -->
              <button type="submit" class="btn-login-submit" id="btnLoginSubmit">
                <span>Log In</span>
                ${Icons.arrowRight}
              </button>
            </form>

            <!-- Forgot Password Form (shown in place of the login form) -->
            <form id="forgotForm" novalidate style="display: none;">
              <div id="forgotInfo" class="form-error" style="color: rgba(255, 255, 255, 0.75);"></div>

              <div id="forgotStepEmail">
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.mail}</span>
                    <input
                      type="email"
                      id="forgotEmail"
                      class="input-dark"
                      placeholder="Registered email address"
                      maxlength="100"
                      autocomplete="email"
                    />
                  </div>
                </div>
              </div>

              <div id="forgotStepReset" style="display: none;">
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.mail}</span>
                    <input
                      type="text"
                      id="forgotCode"
                      class="input-dark"
                      placeholder="6-digit reset code"
                      maxlength="6"
                      inputmode="numeric"
                      autocomplete="one-time-code"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.lock}</span>
                    <input
                      type="password"
                      id="forgotPassword"
                      class="input-dark"
                      placeholder="New password"
                      autocomplete="new-password"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.lock}</span>
                    <input
                      type="password"
                      id="forgotConfirm"
                      class="input-dark"
                      placeholder="Confirm new password"
                      autocomplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div id="forgotError" class="form-error" style="display: none;"></div>

              <button type="submit" class="btn-login-submit" id="btnForgotSubmit">
                <span id="forgotSubmitLabel">Send Reset Code</span>
                ${Icons.arrowRight}
              </button>

              <div class="login-options-row" style="justify-content: center;">
                <a href="#/login" id="btnForgotBack" class="link-teal">Back to Log In</a>
              </div>
            </form>

            <!-- Bottom Sign Up Link -->
            <div class="login-card-footer">
              <span>Don't have an account? </span>
              <a href="#/register" class="link-teal">Sign Up</a>
            </div>
          </div>
        </div>
      </div>

      ${renderFooter('public')}
    </div>
  `;

  // Toggle Password Visibility
  const pwdInput = container.querySelector('#loginPassword');
  const btnTogglePwd = container.querySelector('#btnTogglePassword');
  const eyeIcon = container.querySelector('#pwdEyeIcon');
  let isPwdVisible = false;

  btnTogglePwd.addEventListener('click', () => {
    isPwdVisible = !isPwdVisible;
    pwdInput.type = isPwdVisible ? 'text' : 'password';
    eyeIcon.innerHTML = isPwdVisible ? Icons.eyeOff : Icons.eye;
  });

  // Remember me toggle
  const rememberCheckbox = container.querySelector('#rememberMeCheckbox');
  rememberCheckbox.addEventListener('change', (e) => {
    const custom = container.querySelector('.checkbox-custom');
    if (e.target.checked) {
      custom.style.background = 'var(--primary-glow)';
      custom.style.color = '#042017';
    } else {
      custom.style.background = 'rgba(4, 21, 17, 0.8)';
      custom.style.color = 'transparent';
    }
  });

  // Form submission & authentication
  const form = container.querySelector('#loginForm');
  const identifierInput = container.querySelector('#loginIdentifier');
  const identError = container.querySelector('#identifierError');
  const pwdError = container.querySelector('#passwordError');
  const btnSubmit = container.querySelector('#btnLoginSubmit');

  async function performLogin() {
    if (identError) identError.style.display = 'none';
    if (pwdError) pwdError.style.display = 'none';

    const ident = identifierInput ? identifierInput.value.trim() : '';
    const pwd = pwdInput ? pwdInput.value : '';

    if (!ident) {
      if (identError) {
        identError.textContent = 'Please enter your email or username.';
        identError.style.display = 'block';
      }
      if (identifierInput) identifierInput.focus();
      return;
    }

    if (!pwd || pwd.length < 3) {
      if (pwdError) {
        pwdError.textContent = 'Password must be at least 3 characters.';
        pwdError.style.display = 'block';
      }
      if (pwdInput) pwdInput.focus();
      return;
    }

    btnSubmit.disabled = true;
    try {
      const response = await fetch(appStore.getApiBase() + 'login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: ident, password: pwd })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        pwdError.textContent = result.error || 'Login failed. Please try again.';
        pwdError.style.display = 'block';
        pwdInput.focus();
        return;
      }

      appStore.update({ auth: { isLoggedIn: true, user: result.user } });
      router.navigate('/dashboard');
    } catch (_) {
      pwdError.textContent = 'Unable to reach the server. Please check that Apache and MySQL are running.';
      pwdError.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void performLogin();
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      void performLogin();
    });
  }

  // Forgot Password form
  const btnForgot = container.querySelector('#btnForgotPassword');
  const forgotForm = container.querySelector('#forgotForm');
  if (btnForgot && forgotForm) {
    const MIN_RESET_PASSWORD_LENGTH = 6;
    const tagline = container.querySelector('.brand-tagline');
    const loginNotice = container.querySelector('#loginNotice');
    const stepEmail = container.querySelector('#forgotStepEmail');
    const stepReset = container.querySelector('#forgotStepReset');
    const forgotEmail = container.querySelector('#forgotEmail');
    const forgotCode = container.querySelector('#forgotCode');
    const forgotPassword = container.querySelector('#forgotPassword');
    const forgotConfirm = container.querySelector('#forgotConfirm');
    const forgotInfo = container.querySelector('#forgotInfo');
    const forgotError = container.querySelector('#forgotError');
    const forgotSubmitLabel = container.querySelector('#forgotSubmitLabel');
    const btnForgotSubmit = container.querySelector('#btnForgotSubmit');
    const btnForgotBack = container.querySelector('#btnForgotBack');

    let resetEmail = '';
    let isCodeStep = false;

    function showForgotError(message, input) {
      forgotError.textContent = message;
      forgotError.style.display = 'block';
      if (input) input.focus();
    }

    function showCodeStep(active, info) {
      isCodeStep = active;
      stepEmail.style.display = active ? 'none' : '';
      stepReset.style.display = active ? '' : 'none';
      forgotSubmitLabel.textContent = active ? 'Reset Password' : 'Send Reset Code';
      forgotInfo.textContent = info;
      forgotError.style.display = 'none';
    }

    function showForgotForm(visible) {
      form.style.display = visible ? 'none' : '';
      forgotForm.style.display = visible ? '' : 'none';
      if (tagline) tagline.textContent = visible ? 'Reset your password' : 'Smart. Cool. Better Living.';
    }

    async function postReset(payload) {
      const response = await fetch(appStore.getApiBase() + 'forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.json();
    }

    async function requestCode() {
      const email = forgotEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showForgotError('Please enter a valid email address.', forgotEmail);
        return;
      }

      const result = await postReset({ action: 'request', email });
      if (!result.success) {
        showForgotError(result.error || 'Password reset could not be started. Please try again.', forgotEmail);
        return;
      }

      resetEmail = email;
      forgotCode.value = '';
      forgotPassword.value = '';
      forgotConfirm.value = '';
      showCodeStep(true, result.delivered
        ? `A 6-digit reset code has been sent to ${email}. Enter it below with your new password.`
        : `Email delivery is not configured on this server. Your reset code is ${result.devCode}.`);
      forgotCode.focus();
    }

    async function submitNewPassword() {
      const code = forgotCode.value.trim();
      const password = forgotPassword.value;

      if (!/^\d{6}$/.test(code)) {
        showForgotError('Please enter the 6-digit reset code.', forgotCode);
        return;
      }
      if (password.length < MIN_RESET_PASSWORD_LENGTH) {
        showForgotError(`Password must be at least ${MIN_RESET_PASSWORD_LENGTH} characters.`, forgotPassword);
        return;
      }
      if (forgotConfirm.value !== password) {
        showForgotError('Passwords do not match.', forgotConfirm);
        return;
      }

      const result = await postReset({ action: 'reset', email: resetEmail, code, password });
      if (!result.success) {
        // An expired or locked code sends the user back to request a new one
        if (!result.retry) showCodeStep(false, 'Enter your registered email address to receive password reset instructions.');
        showForgotError(result.error || 'Password reset failed. Please try again.', result.retry ? forgotCode : forgotEmail);
        return;
      }

      showForgotForm(false);
      loginNotice.textContent = 'Your password has been reset. You can now log in with your new password.';
      loginNotice.style.display = 'block';
      if (identifierInput) identifierInput.value = resetEmail;
      if (pwdInput) {
        pwdInput.value = '';
        pwdInput.focus();
      }
    }

    btnForgot.addEventListener('click', (e) => {
      e.preventDefault();
      const typed = identifierInput ? identifierInput.value.trim() : '';
      forgotEmail.value = typed.includes('@') ? typed : '';
      loginNotice.style.display = 'none';
      showCodeStep(false, 'Enter your registered email address to receive password reset instructions.');
      showForgotForm(true);
      forgotEmail.focus();
    });

    btnForgotBack.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotForm(false);
    });

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btnForgotSubmit.disabled) return;
      forgotError.style.display = 'none';
      btnForgotSubmit.disabled = true;
      try {
        await (isCodeStep ? submitNewPassword() : requestCode());
      } catch (_) {
        showForgotError('Unable to reach the server. Please check that Apache and MySQL are running.');
      } finally {
        btnForgotSubmit.disabled = false;
      }
    });
  }

  return () => {};
}
