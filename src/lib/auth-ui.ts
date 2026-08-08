import { loginWithGoogle, logout, getUser, isAuthenticated } from '@/lib/auth';
import { showToast } from '@/lib/toastTrigger';

export interface AuthUIElements {
  loginSection: HTMLElement;
  userSection: HTMLElement;
  loginBtn: HTMLButtonElement;
  loginBtnText: HTMLElement;
  logoutBtn: HTMLButtonElement;
  avatar: HTMLImageElement;
  name: HTMLElement;
  email: HTMLElement;
  fallbackAvatar: string;
}

// Inicializa el bloque auth (login/logout) de un navbar. El listener de
// `authchange` se registra UNA sola vez aquí (no dentro del click de logout),
// así logout() → dispatch authchange → updateUI sin acumular listeners.
export function initAuthUI(elements: AuthUIElements): void {
  const { loginSection, userSection, loginBtn, loginBtnText, logoutBtn, avatar, name, email, fallbackAvatar } = elements;

  function updateUI() {
    if (isAuthenticated()) {
      loginSection.classList.add('hidden');
      userSection.classList.remove('hidden');

      const user = getUser();
      if (user) {
        avatar.src = user.picture || fallbackAvatar;
        name.textContent = user.name || '';
        email.textContent = user.email || '';
      }
    } else {
      loginSection.classList.remove('hidden');
      userSection.classList.add('hidden');
    }
  }

  function setLoading(loading: boolean) {
    loginBtn.disabled = loading;
    loginBtnText.textContent = loading ? 'Cargando...' : 'Iniciar sesión';
  }

  updateUI();
  window.addEventListener('authchange', updateUI);

  loginBtn.addEventListener('click', async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  });

  logoutBtn.addEventListener('click', () => {
    logout();
  });
}
