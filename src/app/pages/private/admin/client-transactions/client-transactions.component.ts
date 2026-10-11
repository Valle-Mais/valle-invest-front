import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ClientTransactionsService, IClientTransaction, TransactionStatus } from '../../../../services/client-transactions.service';
import { ClientsService, IUser } from '../../../../services/clients.service';
import { ConfirmService, ToastService, VlBadgeComponent, VlButtonComponent, VlCellDirective, VlColumn, VlDataTableComponent, VlFieldComponent, VlInputDirective, VlPageHeaderComponent, VlPaginationComponent } from '../../../../ui';
import { PendingRequestsComponent } from '../shared/pending-requests.component';
import { AdminTransactionDrawerComponent } from '../shared/admin-transaction-drawer.component';
import { formatBrl } from '../../../../shared/format';

const PAGE_SIZE = 10;

/** Aportes e resgates: inbox de pendências primeiro, histórico com filtros depois. */
@Component({
  selector: 'app-client-transactions',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, VlPageHeaderComponent, VlDataTableComponent, VlCellDirective, VlPaginationComponent, VlBadgeComponent, VlButtonComponent, VlFieldComponent, VlInputDirective, PendingRequestsComponent, AdminTransactionDrawerComponent],
  templateUrl: './client-transactions.component.html',
})
export class ClientTransactionsComponent {
  private readonly service = inject(ClientTransactionsService);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly all = signal<IClientTransaction[]>([]);
  readonly clients = signal<IUser[]>([]);
  readonly loading = signal(true);

  readonly status = signal<'Todos' | TransactionStatus>('Todos');
  readonly clientId = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly page = signal(1);

  readonly drawerOpen = signal(false);
  readonly editing = signal<IClientTransaction | null>(null);

  readonly pending = computed(() => this.all().filter((t) => t.status === 'Pendente'));

  readonly history = computed(() => {
    const status = this.status();
    const clientId = this.clientId();
    const start = this.startDate() ? new Date(this.startDate()) : null;
    const end = this.endDate() ? new Date(`${this.endDate()}T23:59:59.999Z`) : null;
    return this.all()
      .filter((t) => t.tipo !== 'Rendimento')
      .filter((t) => status === 'Todos' || t.status === status)
      .filter((t) => !clientId || t.clientId === clientId)
      .filter((t) => !start || new Date(t.data) >= start)
      .filter((t) => !end || new Date(t.data) <= end);
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.history().length / PAGE_SIZE)));
  readonly rows = computed(() => this.history().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE));

  readonly columns: VlColumn<IClientTransaction>[] = [
    { key: 'data', header: 'Data', class: 'num', cell: (t) => new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
    { key: 'clientName', header: 'Cliente' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'valor', header: 'Valor', align: 'right', class: 'num font-semibold', cell: (t) => formatBrl(t.valor) },
    { key: 'status', header: 'Situação', align: 'center' },
    { key: 'acoes', header: '', align: 'right' },
  ];

  constructor() {
    this.load();
    this.clientsService.getClients().subscribe({ next: (c) => this.clients.set(c) });
  }

  load(): void {
    this.loading.set(true);
    this.service.getClientTransactions().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Não foi possível carregar as transações.');
      },
    });
  }

  resetPage(): void {
    this.page.set(1);
  }

  clearFilters(): void {
    this.status.set('Todos');
    this.clientId.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.page.set(1);
  }

  openCreate(): void {
    this.editing.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(t: IClientTransaction): void {
    this.editing.set(t);
    this.drawerOpen.set(true);
  }

  async remove(t: IClientTransaction): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir esta transação?',
      message: `${t.tipo} de ${formatBrl(t.valor)} de ${t.clientName}.${t.status === 'Aprovado' ? '\nO saldo do cliente é recalculado e os rendimentos posteriores, reprocessados.' : ''}`,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteClientTransaction(t.id).subscribe({
      next: () => {
        this.toast.success('Transação excluída.');
        this.service.notifyPendingRequestsChange();
        this.load();
      },
      error: (err) => this.toast.error(err.error?.message || 'Não foi possível excluir.'),
    });
  }

  statusTone(status: TransactionStatus): 'positive' | 'negative' | 'warning' {
    return status === 'Aprovado' ? 'positive' : status === 'Negado' ? 'negative' : 'warning';
  }

  typeTone(tipo: IClientTransaction['tipo']): 'positive' | 'negative' | 'accent' {
    return tipo === 'Resgate' ? 'negative' : tipo === 'Aporte' ? 'positive' : 'accent';
  }
}
