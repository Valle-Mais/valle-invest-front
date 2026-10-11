import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { ConfirmService, ToastService, VlBadgeComponent, VlButtonComponent, VlEmptyStateComponent, VlSkeletonComponent } from '../../../../ui';
import { formatBrl } from '../../../../shared/format';

/** Solicitações pendentes com Aprovar e Negar. Só muda o status; o saldo é recalculado pela API. */
@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, VlBadgeComponent, VlButtonComponent, VlEmptyStateComponent, VlSkeletonComponent],
  templateUrl: './pending-requests.component.html',
})
export class PendingRequestsComponent {
  private readonly service = inject(ClientTransactionsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly requests = input<IClientTransaction[]>([]);
  readonly loading = input(false);
  readonly changed = output<void>();

  readonly busyId = signal<string | null>(null);

  async process(t: IClientTransaction, status: 'Aprovado' | 'Negado'): Promise<void> {
    const approve = status === 'Aprovado';
    const ok = await this.confirm.ask({
      title: approve ? `Aprovar ${t.tipo.toLowerCase()} de ${formatBrl(t.valor)}?` : `Negar ${t.tipo.toLowerCase()} de ${formatBrl(t.valor)}?`,
      message: approve
        ? `${t.clientName} terá o saldo atualizado na hora. Se a data for anterior a alguma operação, os rendimentos são reprocessados.`
        : `${t.clientName} verá a solicitação como negada.`,
      confirmLabel: approve ? 'Aprovar' : 'Negar',
      danger: !approve,
    });
    if (!ok) return;

    this.busyId.set(t.id);
    this.service.updateClientTransaction(t.id, { status }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(approve ? 'Solicitação aprovada.' : 'Solicitação negada.');
        this.service.notifyPendingRequestsChange();
        this.changed.emit();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err.error?.message || 'Não foi possível processar a solicitação.');
      },
    });
  }

  tone(tipo: IClientTransaction['tipo']): 'positive' | 'negative' | 'accent' {
    return tipo === 'Resgate' ? 'negative' : tipo === 'Aporte' ? 'positive' : 'accent';
  }

  fmt = formatBrl;
}
