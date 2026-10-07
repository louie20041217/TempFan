/**
 * views/profile.js - My Profile View
 * Lets the signed-in user change their username, email, password and profile photo.
 */

import { Icons } from '../icons.js';
import { appStore } from '../state.js';
import { renderAppShell, attachShellEvents, isSafeAvatar } from './shell.js';
import { showAlert } from '../dialog.js';

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const AVATAR_SIZE = 256;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// Centre-crops the chosen picture to a small square JPEG so it is cheap to store and send
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      ctx.drawImage(
        image,
        (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side,
        0, 0, AVATAR_SIZE, AVATAR_SIZE
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    image.src = url;
  });
}

export function renderProfile(container, router) {
  const user = appStore.get().auth.user || {};
  const savedAvatar = isSafeAvatar(user.avatar) ? user.avatar : '';
  const initial = (user.name || 'A').charAt(0).toUpperCase();

  const contentHTML = `
    <form class="settings-view profile-view" id="profileForm" novalidate>
      <!-- Card 1: Profile Photo -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Profile Photo</h2>
            <p class="section-desc">Shown in the header and the navigation menu</p>
          </div>
        </div>

        <div class="profile-photo-row">
          <div class="profile-photo-preview" id="profilePhotoPreview"></div>
          <div class="profile-photo-meta">
            <div class="profile-photo-name">${user.name || ''}</div>
            <div class="profile-photo-role">${user.role || ''}</div>
            <div class="profile-photo-actions">
              <button type="button" class="btn-customize-thresh" id="btnChoosePhoto">
                ${Icons.edit}
                <span>Change Photo</span>
              </button>
              <button type="button" class="btn-customize-thresh" id="btnRemovePhoto">Remove</button>
              <input type="file" id="profilePhotoInput" accept="image/png,image/jpeg,image/webp" hidden>
            </div>
            <div class="profile-field-error" id="profileAvatarError" style="display: none;"></div>
          </div>
        </div>
      </div>

      <!-- Card 2: Account Information -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Account Information</h2>
            <p class="section-desc">Your username and email are used to log in</p>
          </div>
        </div>

        <div class="profile-fields-grid">
          <div class="profile-field">
            <label for="profileUsername">Username</label>
            <input type="text" id="profileUsername" class="input-light" value="${user.name || ''}" maxlength="50" autocomplete="username">
            <div class="profile-field-error" id="profileUsernameError" style="display: none;"></div>
          </div>
          <div class="profile-field">
            <label for="profileEmail">Email Address</label>
            <input type="email" id="profileEmail" class="input-light" value="${user.email || ''}" maxlength="100" autocomplete="email">
            <div class="profile-field-error" id="profileEmailError" style="display: none;"></div>
          </div>
          <div class="profile-field">
            <label for="profileRole">Role</label>
            <input type="text" id="profileRole" class="input-light" value="${user.role || ''}" disabled>
          </div>
        </div>
      </div>

      <!-- Card 3: Change Password -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Change Password</h2>
            <p class="section-desc">Leave these blank to keep your current password</p>
          </div>
        </div>

        <div class="profile-fields-grid">
          <div class="profile-field">
            <label for="profileNewPassword">New Password</label>
            <input type="password" id="profileNewPassword" class="input-light" placeholder="At least ${MIN_PASSWORD_LENGTH} characters" autocomplete="new-password">
            <div class="profile-field-error" id="profileNewPasswordError" style="display: none;"></div>
          </div>
          <div class="profile-field">
            <label for="profileConfirmPassword">Confirm New Password</label>
            <input type="password" id="profileConfirmPassword" class="input-light" autocomplete="new-password">
            <div class="profile-field-error" id="profileConfirmPasswordError" style="display: none;"></div>
          </div>
        </div>
      </div>

      <!-- Card 4: Confirm & Save -->
      <div class="settings-section-card">
        <div class="section-head-wrap">
          <div class="section-head-text">
            <h2 class="section-title">Confirm Changes</h2>
            <p class="section-desc">Enter your current password to save any change</p>
          </div>
        </div>

        <div class="profile-confirm-row">
          <div class="profile-field">
            <label for="profileCurrentPassword">Current Password</label>
            <input type="password" id="profileCurrentPassword" class="input-light" autocomplete="current-password">
            <div class="profile-field-error" id="profileCurrentPasswordError" style="display: none;"></div>
          </div>
          <button type="submit" class="btn-save-settings" id="btnSaveProfile">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save Changes</span>
          </button>
        </div>
        <div class="profile-field-error" id="profileFormError" style="display: none;"></div>
      </div>
    </form>
  `;

  container.innerHTML = renderAppShell(
    '/profile',
    'My Profile',
    'Manage your account details and profile photo',
    contentHTML,
    router
  );

  const cleanupShell = attachShellEvents(container, router);

  const form = container.querySelector('#profileForm');
  const btnSave = container.querySelector('#btnSaveProfile');
  const preview = container.querySelector('#profilePhotoPreview');
  const photoInput = container.querySelector('#profilePhotoInput');
  const btnRemovePhoto = container.querySelector('#btnRemovePhoto');
  const fields = {
    username: container.querySelector('#profileUsername'),
    email: container.querySelector('#profileEmail'),
    newPassword: container.querySelector('#profileNewPassword'),
    confirmPassword: container.querySelector('#profileConfirmPassword'),
    currentPassword: container.querySelector('#profileCurrentPassword')
  };
  const errors = {
    avatar: container.querySelector('#profileAvatarError'),
    username: container.querySelector('#profileUsernameError'),
    email: container.querySelector('#profileEmailError'),
    newPassword: container.querySelector('#profileNewPasswordError'),
    confirmPassword: container.querySelector('#profileConfirmPasswordError'),
    currentPassword: container.querySelector('#profileCurrentPasswordError'),
    form: container.querySelector('#profileFormError')
  };

  // The photo currently shown; differs from savedAvatar until the form is saved
  let avatar = savedAvatar;

  function renderPreview() {
    preview.innerHTML = avatar ? `<img src="${avatar}" alt="Profile photo">` : `<span>${initial}</span>`;
    btnRemovePhoto.style.display = avatar ? '' : 'none';
  }

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

  renderPreview();

  container.querySelector('#btnChoosePhoto').addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    photoInput.value = '';
    if (!file) return;

    errors.avatar.style.display = 'none';
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      showError('avatar', 'Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      showError('avatar', 'Please choose an image smaller than 8 MB.');
      return;
    }

    try {
      avatar = await fileToAvatar(file);
      renderPreview();
    } catch (err) {
      showError('avatar', err.message);
    }
  });

  btnRemovePhoto.addEventListener('click', () => {
    avatar = '';
    errors.avatar.style.display = 'none';
    renderPreview();
  });

  let isSaving = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSaving) return;
    clearErrors();

    const values = {
      username: fields.username.value.trim(),
      email: fields.email.value.trim(),
      newPassword: fields.newPassword.value,
      confirmPassword: fields.confirmPassword.value,
      currentPassword: fields.currentPassword.value
    };

    let firstInvalid = null;
    const fail = (key, message) => {
      showError(key, message);
      if (!firstInvalid) firstInvalid = key;
    };

    if (!USERNAME_PATTERN.test(values.username)) {
      fail('username', 'Use 3-50 letters, numbers, dots, dashes or underscores.');
    }
    if (!EMAIL_PATTERN.test(values.email)) {
      fail('email', 'Please enter a valid email address.');
    }
    if (values.newPassword && values.newPassword.length < MIN_PASSWORD_LENGTH) {
      fail('newPassword', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (values.confirmPassword !== values.newPassword) {
      fail('confirmPassword', 'Passwords do not match.');
    }
    if (firstInvalid) {
      fields[firstInvalid].focus();
      return;
    }

    const avatarChanged = avatar !== savedAvatar;
    const hasChanges = avatarChanged || values.newPassword !== '' ||
      values.username !== (user.name || '') || values.email !== (user.email || '');
    if (!hasChanges) {
      showError('form', 'There are no changes to save.');
      return;
    }
    if (!values.currentPassword) {
      showError('currentPassword', 'Enter your current password to save changes.');
      fields.currentPassword.focus();
      return;
    }

    const payload = {
      currentUsername: user.name || user.email || '',
      currentPassword: values.currentPassword,
      username: values.username,
      email: values.email,
      newPassword: values.newPassword
    };
    if (avatarChanged) payload.avatar = avatar;

    isSaving = true;
    btnSave.disabled = true;

    let result = null;
    try {
      const response = await fetch(appStore.getApiBase() + 'profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result = await response.json();
    } catch (_) {
      result = { success: false, field: 'form', error: 'Unable to reach the server. Please check that Apache and MySQL are running.' };
    }

    isSaving = false;
    btnSave.disabled = false;

    if (!result.success) {
      const key = errors[result.field] ? result.field : 'form';
      showError(key, result.error || 'Your profile could not be updated. Please try again.');
      if (fields[key]) fields[key].focus();
      return;
    }

    appStore.update({ auth: { isLoggedIn: true, user: result.user } });
    // Re-render so the header, menu and this form all show the saved details
    router.navigate('/profile');
    showAlert({
      type: 'success',
      title: 'Profile Updated',
      message: result.passwordChanged
        ? 'Your account details were saved.\nUse your new password the next time you log in.'
        : 'Your account details were saved.'
    });
  });

  return cleanupShell;
}
