export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export const toastStyles: Record<ToastType, { toast: string; icon: string }> = {
  error: { toast: 'bg-linear-to-r from-error/70 to-error/20 border-error shadow-lg shadow-error/30 animate-fade-in animate-duration-fast', icon: 'fa-circle-exclamation text-error' },
  success: { toast: 'bg-linear-to-r from-success/70 to-success/20 border-success shadow-lg shadow-success/30 animate-fade-in animate-duration-fast', icon: 'fa-circle-check text-success' },
  warning: { toast: 'bg-linear-to-r from-warning/70 to-warning/20 border-warning shadow-lg shadow-warning/30 animate-fade-in animate-duration-fast', icon: 'fa-triangle-exclamation text-warning' },
  info: { toast: 'bg-linear-to-r from-info/70 to-info/20 border-info shadow-lg shadow-info/30 animate-fade-in animate-duration-fast', icon: 'fa-circle-info text-info' },
};

const listeners = new Set<(toasts: ToastItem[]) => void>();
let toasts: ToastItem[] = [];
let nextId = 1;

const TOAST_DURATION_MS = 5000;

function emit() {
  listeners.forEach((cb) => cb(toasts));
}

export function subscribeToasts(cb: (toasts: ToastItem[]) => void): () => void {
  listeners.add(cb);
  cb(toasts);
  return () => {
    listeners.delete(cb);
  };
}

export function showToast(message: string, type: ToastType = 'error'): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}