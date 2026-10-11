import { Injectable, signal } from '@angular/core';

export interface VlConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ação destrutiva: botão de confirmar em vermelho. */
  danger?: boolean;
}

interface PendingConfirm extends VlConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Substitui window.confirm.
 *
 * if (await confirm.ask({ title: 'Excluir operação?', danger: true })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: VlConfirmOptions): Promise<boolean> {
    // Só um diálogo por vez: o anterior é cancelado.
    this.pending()?.resolve(false);
    return new Promise<boolean>((resolve) => this.pending.set({ ...options, resolve }));
  }

  answer(value: boolean): void {
    const current = this.pending();
    this.pending.set(null);
    current?.resolve(value);
  }
}
