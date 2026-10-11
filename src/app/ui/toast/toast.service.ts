import { Injectable, signal } from '@angular/core';

export type VlToastKind = 'success' | 'error' | 'info' | 'warning';

export interface VlToast {
  id: number;
  kind: VlToastKind;
  message: string;
}

/**
 * Feedback de ações. Usar em todo sucesso ou erro visível ao usuário;
 * `console.error` sozinho não é feedback.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<VlToast[]>([]);
  private seq = 0;

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message, 8000);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  show(kind: VlToastKind, message: string, durationMs = 5000): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
