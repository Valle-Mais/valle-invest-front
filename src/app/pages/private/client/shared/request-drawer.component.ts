import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClientTransactionsService, TransactionType } from '../../../../services/client-transactions.service';
import { ToastService, VlButtonComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective } from '../../../../ui';
import { todayLocalIso } from '../../../../shared/format';

/**
 * Drawer único para o cliente solicitar aporte ou resgate.
 * A API usa o clientId do token; o front manda o próprio id só por compatibilidade.
 */
@Component({
  selector: 'app-request-drawer',
  standalone: true,
  imports: [FormsModule, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlButtonComponent],
  templateUrl: './request-drawer.component.html',
})
export class RequestDrawerComponent {
  private readonly auth = inject(AuthService);
  private readonly transactions = inject(ClientTransactionsService);
  private readonly toast = inject(ToastService);

  readonly open = model(false);
  readonly tipo = input<Exclude<TransactionType, 'Rendimento'>>('Aporte');
  readonly saldoAtual = input<number | null>(null);
  readonly created = output<void>();

  valor: number | null = null;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  get title(): string {
    return this.tipo() === 'Aporte' ? 'Solicitar aporte' : 'Solicitar resgate';
  }

  close(): void {
    this.open.set(false);
    this.valor = null;
    this.error.set(null);
  }

  submit(): void {
    const valor = Number(this.valor);
    if (!valor || valor <= 0) {
      this.error.set('Informe um valor maior que zero.');
      return;
    }
    const saldo = this.saldoAtual();
    if (this.tipo() === 'Resgate' && saldo != null && valor > saldo) {
      this.error.set('O resgate não pode ser maior que o seu saldo atual.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.transactions
      .createRequest({
        tipo: this.tipo(),
        valor,
        data: todayLocalIso(),
        clientId: this.auth.getUserId() ?? undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(`Solicitação de ${this.tipo().toLowerCase()} enviada. O administrador vai analisar.`);
          this.transactions.notifyPendingRequestsChange();
          this.close();
          this.created.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'Não foi possível enviar a solicitação.');
        },
      });
  }
}
