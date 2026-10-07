/**
 * views/register.js - Registration Page View
 * Shares the Login page shell (topbar, backdrop, glass card) with a two-column form.
 */

import { Icons } from '../icons.js';
import { renderFooter } from '../footer.js';
import { appStore } from '../state.js';

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function renderRegister(container, router) {
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
          <a href="#/login">${Icons.user}<span>Log In</span></a>
          <a class="login-nav-current" href="#/register">${Icons.userPlus}<span>Register</span></a>
        </nav>
      </header>

      <div class="login-layout">
        <!-- Translucent Registration Card -->
        <div class="login-right-content register-content">
          <div class="login-card">
            <div class="login-card-brand">
              <div class="brand-row">
                <div class="brand-icon-clover">
                  ${Icons.logo}
                </div>
                <span class="brand-title-white">TempFan</span>
              </div>
              <span class="brand-tagline">Create your account</span>
            </div>

            <form id="registerForm" novalidate>
              <div class="form-grid">
                <!-- Input 1: Username -->
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.user}</span>
                    <input
                      type="text"
                      id="registerUsername"
                      class="input-dark"
                      placeholder="Username"
                      required
                      maxlength="50"
                      autocomplete="username"
                    />
                  </div>
                  <div id="registerUsernameError" class="form-error" style="display: none;"></div>
                </div>

                <!-- Input 2: Email -->
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.mail}</span>
                    <input
                      type="email"
                      id="registerEmail"
                      class="input-dark"
                      placeholder="Email address"
                      required
                      maxlength="100"
                      autocomplete="email"
                    />
                  </div>
                  <div id="registerEmailError" class="form-error" style="display: none;"></div>
                </div>

                <!-- Input 3: Password -->
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.lock}</span>
                    <input
                      type="password"
                      id="registerPassword"
                      class="input-dark"
                      placeholder="Password"
                      required
                      autocomplete="new-password"
                    />
                    <button type="button" class="btn-toggle-pwd" data-toggle="registerPassword" aria-label="Toggle password visibility">
                      ${Icons.eye}
                    </button>
                  </div>
                  <div id="registerPasswordError" class="form-error" style="display: none;"></div>
                </div>

                <!-- Input 4: Confirm Password -->
                <div class="form-group">
                  <div class="input-icon-wrap">
                    <span class="input-icon">${Icons.lock}</span>
                    <input
                      type="password"
                      id="registerConfirm"
                      class="input-dark"
                      placeholder="Confirm password"
                      required
                      autocomplete="new-password"
                    />
                    <button type="button" class="btn-toggle-pwd" data-toggle="registerConfirm" aria-label="Toggle password visibility">
                      ${Icons.eye}
                    </button>
                  </div>
                  <div id="registerConfirmError" class="form-error" style="display: none;"></div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="register-actions">
                <button type="submit" class="btn-login-submit" id="btnRegisterSubmit">
                  <span>Create Account</span>
                  ${Icons.arrowRight}
                </button>
              </div>

              <div id="registerFormError" class="form-error" style="display: none;"></div>
            </form>

            <!-- Bottom Log In Link -->
            <div class="login-card-footer">
              <span>Already have an account? </span>
              <a href="#/login" class="link-teal">Log In</a>
            </div>
          </div>
        </div>
      </div>

      ${renderFooter('public')}
    </div>
  `;

  const form = container.querySelector('#registerForm');
  const btnSubmit = container.querySelector('#btnRegisterSubmit');
  const fields = {
    username: container.querySelector('#registerUsername'),
    email: container.querySelector('#registerEmail'),
    password: container.querySelector('#registerPassword'),
    confirm: container.querySelector('#registerConfirm')
  };
  const errors = {
    username: container.querySelector('#registerUsernameError'),
    email: container.querySelector('#registerEmailError'),
    password: container.querySelector('#registerPasswordError'),
    confirm: container.querySelector('#registerConfirmError'),
    form: container.querySelector('#registerFormError')
  };

  function showError(key, message) {
    errors[key].textContent = message;
    errors[key].style.display = 'block';
  }

  function clearErrors() {
    Object.values(errors).forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  // Toggle Password Visibility
  container.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector('#' + btn.getAttribute('data-toggle'));
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      btn.innerHTML = reveal ? Icons.eyeOff : Icons.eye;
    });
  });

  // Returns the first invalid field's key, or null when everything is valid
  function validate(values) {
    let firstInvalid = null;
    const fail = (key, message) => {
      showError(key, message);
      if (!firstInvalid) firstInvalid = key;
    };

    if (!values.username) {
      fail('username', 'Please choose a username.');
    } else if (!USERNAME_PATTERN.test(values.username)) {
      fail('username', 'Use 3-50 letters, numbers, dots, dashes or underscores.');
    }

    if (!values.email) {
      fail('email', 'Please enter your email address.');
    } else if (!EMAIL_PATTERN.test(values.email)) {
      fail('email', 'Please enter a valid email address.');
    }

    if (values.password.length < MIN_PASSWORD_LENGTH) {
      fail('password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    if (!values.confirm) {
      fail('confirm', 'Please confirm your password.');
    } else if (values.confirm !== values.password) {
      fail('confirm', 'Passwords do not match.');
    }

    return firstInvalid;
  }

  function signIn(values) {
    appStore.update({
      auth: {
        isLoggedIn: true,
        user: {
          name: values.username,
          email: values.email,
          role: 'IoT Technician'
        }
      }
    });
    router.navigate('/dashboard');
  }

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    clearErrors();

    const values = {
      username: fields.username.value.trim(),
      email: fields.email.value.trim(),
      password: fields.password.value,
      confirm: fields.confirm.value
    };

    const firstInvalid = validate(values);
    if (firstInvalid) {
      fields[firstInvalid].focus();
      return;
    }

    isSubmitting = true;
    btnSubmit.disabled = true;

    let result = null;
    try {
      const response = await fetch(appStore.getApiBase() + 'register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, email: values.email, password: values.password })
      });
      result = await response.json();
    } catch (_) {
      // Server unreachable: fall through to the offline simulator behaviour below.
    }

    isSubmitting = false;
    btnSubmit.disabled = false;

    // The server rejected the details (duplicate account or invalid input)
    if (result && !result.success && result.source !== 'memory') {
      const key = errors[result.field] ? result.field : 'form';
      showError(key, result.error || 'Registration failed. Please try again.');
      if (fields[key]) fields[key].focus();
      return;
    }

    // Saved to MySQL, or MySQL is offline and the app is running in simulator mode
    signIn(values);
  });

  return () => {};
}
