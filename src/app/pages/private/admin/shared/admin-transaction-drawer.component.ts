import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { IUser } from '../../../../services/clients.service';
import { ToastService, VlButtonComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective } from '../../../../ui';
import { todayLocalIso } from '../../../../shared/format';

/**
 * Admin registra um aporte ou resgate já aprovado em nome de um cliente,
 * ou edita uma transação existente. O saldo é recalculado pela API.
 */
@Component({
  selector: 'app-admin-transaction-drawer',
  standalone: true,
  imports: [FormsModule, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlButtonComponent],
  templateUrl: './admin-transaction-drawer.component.html',
})
export class AdminTransactionDrawerComponent {
  private readonly service = inject(ClientTransactionsService);
  private readonly toast = inject(ToastService);

  readonly open = model(false);
  readonly clients = input<IUser[]>([]);
  /** Cliente fixo (página de detalhe). */
  readonly lockedClientId = input<string | null>(null);
  /** Transação em edição; null para registrar. */
  readonly transaction = input<IClientTransaction | null>(null);
  readonly saved = output<void>();

  clientId = '';
  data = todayLocalIso();
  tipo: 'Aporte' | 'Resgate' = 'Aporte';
  valor: number | null = null;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.transaction());
  readonly title = computed(() => (this.isEdit() ? 'Editar transação' : 'Registrar aporte ou resgate'));
  readonly activeClients = computed(() => this.clients().filter((c) => c.role === 'client'));

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const t = this.transaction();
      this.error.set(null);
      if (t) {
        this.clientId = t.clientId;
        this.data = t.data.slice(0, 10);
        this.tipo = t.tipo === 'Resgate' ? 'Resgate' : 'Aporte';
        this.valor = t.valor;
      } else {
        this.clientId = this.lockedClientId() ?? '';
        this.data = todayLocalIso();
        this.tipo = 'Aporte';
        this.valor = null;
      }
    });
  }

  save(): void {
    const valor = Number(this.valor);
    if (!this.clientId) {
      this.error.set('Selecione o cliente.');
      return;
    }
    if (!valor || valor <= 0) {
      this.error.set('Informe um valor maior que zero.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const t = this.transaction();
    const request$ = t
      ? this.service.updateClientTransaction(t.id, { data: this.data, tipo: this.tipo, valor })
      : this.service.createClientTransaction({ clientId: this.clientId, data: this.data, tipo: this.tipo, valor });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(t ? 'Transação atualizada. Saldo recalculado.' : `${this.tipo} registrado e saldo atualizado.`);
        this.service.notifyPendingRequestsChange();
        this.open.set(false);
        this.saved.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = err.error?.message;
        this.error.set(Array.isArray(msg) ? msg[0] : msg || 'Não foi possível salvar.');
      },
    });
  }
}
