export type ToastType = 'error' | 'success' | 'warning' | 'info';

const TOAST_DURATION_MS = 4000;

const typeConfig: Record<ToastType, { alert: string; icon: string }> = {
  error: {
    alert: 'flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border bg-linear-to-r from-error/20 to-error/10 border-error shadow-lg shadow-error/30 min-w-64',
    icon: 'fa-solid fa-circle-exclamation text-error text-lg',
  },
  success: {
    alert: 'flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border bg-linear-to-r from-success/20 to-success/10 border-success shadow-lg shadow-success/30 min-w-64',
    icon: 'fa-solid fa-circle-check text-success text-lg',
  },
  warning: {
    alert: 'flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border bg-linear-to-r from-warning/20 to-warning/10 border-warning shadow-lg shadow-warning/30 min-w-64',
    icon: 'fa-solid fa-triangle-exclamation text-warning text-lg',
  },
  info: {
    alert: 'flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border bg-linear-to-r from-info/20 to-info/10 border-info shadow-lg shadow-info/30 min-w-64',
    icon: 'fa-solid fa-circle-info text-info text-lg',
  },
};

function getContainer(): HTMLElement | null {
  return document.getElementById('toast-container');
}

export function showToast(message: string, type: ToastType = 'error') {
  const container = getContainer();
  if (!container) return;
  const host = container;

  const config = typeConfig[type];

  const toast = document.createElement('div');
  toast.className = 'animate-fade-in animate-duration-fast backdrop-blur-md';

  const alert = document.createElement('div');
  alert.className = config.alert;
  alert.innerHTML =
    '<i class="' + config.icon + '"></i>' +
    '<span class="text-white text-sm font-medium flex-1"></span>' +
    '<button class="text-white/40 hover:text-white/70 transition-colors text-lg leading-none">&times;</button>';

  alert.querySelector('span')!.textContent = message;

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function dismiss() {
    if (hideTimer) clearTimeout(hideTimer);
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      if (host.children.length === 0) host.classList.add('hidden');
    }, 300);
  }

  alert.querySelector('button')!.addEventListener('click', dismiss);
  hideTimer = setTimeout(dismiss, TOAST_DURATION_MS);

  toast.appendChild(alert);
  container.classList.remove('hidden');
  container.appendChild(toast);
}

export function hideToast() {
  const container = getContainer();
  if (container) container.classList.add('hidden');
}

// SSR toasts — inicializar los que llegaron con data-toast
document.querySelectorAll<HTMLElement>('[data-toast]').forEach(initToast);

function initToast(toast: HTMLElement) {
  toast.removeAttribute('data-toast');
  toast.querySelector('button')!.addEventListener('click', () => removeToast());
  setTimeout(removeToast, 10000);

  function removeToast() {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }
}

(window as any).showToast = showToast;
