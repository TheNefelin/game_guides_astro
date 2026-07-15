export type ToastType = 'error' | 'success' | 'warning' | 'info';

let hideTimer: ReturnType<typeof setTimeout> | null = null;

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

export function showToast(message: string, type: ToastType = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const alert = document.getElementById('toast-alert')!;
  const icon = document.getElementById('toast-icon')!;
  const msg = document.getElementById('toast-message')!;
  const config = typeConfig[type];

  alert.className = config.alert;
  icon.className = config.icon;
  msg.textContent = message;

  container.classList.remove('hidden');

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => hideToast(), 4000);
}

export function hideToast() {
  const container = document.getElementById('toast-container');
  if (container) container.classList.add('hidden');
}

const closeBtn = document.getElementById('toast-close');
if (closeBtn) closeBtn.addEventListener('click', hideToast);

(window as any).showToast = showToast;
