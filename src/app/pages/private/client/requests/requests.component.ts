import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { VlBadgeComponent, VlButtonComponent, VlCellDirective, VlColumn, VlDataTableComponent, VlEmptyStateComponent, VlPageHeaderComponent, VlSkeletonComponent } from '../../../../ui';
import { RequestDrawerComponent } from '../shared/request-drawer.component';
import { formatBrl } from '../../../../shared/format';

/** Solicitações do cliente: pendentes em destaque, histórico de aportes e resgates abaixo. */
@Component({
  selector: 'app-client-requests',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, VlPageHeaderComponent, VlButtonComponent, VlBadgeComponent, VlDataTableComponent, VlCellDirective, VlEmptyStateComponent, VlSkeletonComponent, RequestDrawerComponent],
  templateUrl: './requests.component.html',
})
export class ClientRequestsComponent {
  private readonly auth = inject(AuthService);
  private readonly transactions = inject(ClientTransactionsService);

  readonly all = signal<IClientTransaction[]>([]);
  readonly loading = signal(true);
  readonly requestOpen = signal(false);
  readonly requestType = signal<'Aporte' | 'Resgate'>('Aporte');

  readonly pending = computed(() => this.all().filter((t) => t.status === 'Pendente'));
  readonly history = computed(() => this.all().filter((t) => t.status !== 'Pendente' && t.tipo !== 'Rendimento'));

  readonly columns: VlColumn<IClientTransaction>[] = [
    { key: 'data', header: 'Data', cell: (t) => new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), class: 'num' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'valor', header: 'Valor', align: 'right', class: 'num font-semibold', cell: (t) => formatBrl(t.valor) },
    { key: 'status', header: 'Situação', align: 'center' },
  ];

  constructor() {
    effect(() => untracked(() => this.load()));
  }

  load(): void {
    const id = this.auth.getUserId();
    if (!id) return;
    this.loading.set(true);
    this.transactions.getClientTransactions({ clientId: id }).subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openRequest(tipo: 'Aporte' | 'Resgate'): void {
    this.requestType.set(tipo);
    this.requestOpen.set(true);
  }

  statusTone(status: IClientTransaction['status']): 'positive' | 'negative' | 'warning' {
    return status === 'Aprovado' ? 'positive' : status === 'Negado' ? 'negative' : 'warning';
  }

  typeTone(tipo: IClientTransaction['tipo']): 'positive' | 'negative' | 'accent' {
    return tipo === 'Resgate' ? 'negative' : tipo === 'Aporte' ? 'positive' : 'accent';
  }

  fmt = formatBrl;
}
