import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FundOperationsService, IFundOperation } from '../../../../services/fund-operations.service';
import { ConfirmService, ToastService, VlButtonComponent, VlCellDirective, VlColumn, VlDataTableComponent, VlFieldComponent, VlInputDirective, VlPageHeaderComponent, VlPaginationComponent } from '../../../../ui';
import { FundOperationDrawerComponent } from '../shared/fund-operation-drawer.component';
import { formatBrl, signed } from '../../../../shared/format';

const PAGE_SIZE = 10;

/** Operações do fundo: histórico com filtros, registro com preview do rateio, edição e exclusão. */
@Component({
  selector: 'app-fund-operations',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, VlPageHeaderComponent, VlDataTableComponent, VlCellDirective, VlPaginationComponent, VlButtonComponent, VlFieldComponent, VlInputDirective, FundOperationDrawerComponent],
  templateUrl: './fund-operations.component.html',
})
export class FundOperationsComponent {
  private readonly service = inject(FundOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly rows = signal<IFundOperation[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly sort = signal<'data:desc' | 'data:asc' | 'valor:desc' | 'valor:asc'>('data:desc');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  readonly drawerOpen = signal(false);
  readonly editing = signal<IFundOperation | null>(null);

  readonly columns: VlColumn<IFundOperation>[] = [
    { key: 'data', header: 'Data', class: 'num', cell: (op) => new Date(op.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
    { key: 'descricao', header: 'Descrição', cell: (op) => op.descricao || '–' },
    { key: 'valorInvestido', header: 'Entrada', align: 'right', class: 'num', hideOnMobile: true, cell: (op) => formatBrl(op.valorInvestido) },
    { key: 'valorVenda', header: 'Saída', align: 'right', class: 'num', hideOnMobile: true, cell: (op) => formatBrl(op.valorVenda) },
    { key: 'resultado', header: 'Resultado', align: 'right', class: 'num font-semibold' },
    { key: 'acoes', header: '', align: 'right' },
  ];

  constructor() {
    effect(() => {
      const params = { page: this.page(), startDate: this.startDate(), endDate: this.endDate(), sort: this.sort() };
      untracked(() => this.load(params));
    });
  }

  private load(p = { page: this.page(), startDate: this.startDate(), endDate: this.endDate(), sort: this.sort() }): void {
    const [sortBy, sortOrder] = p.sort.split(':') as ['data' | 'valor', 'asc' | 'desc'];
    this.loading.set(true);
    this.service
      .getFundOperations({ page: p.page, limit: PAGE_SIZE, startDate: p.startDate || null, endDate: p.endDate || null, sortBy, sortOrder })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Não foi possível carregar as operações.');
        },
      });
  }

  reload(): void {
    this.load();
  }

  setFilter(field: 'startDate' | 'endDate', value: string): void {
    this[field].set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.sort.set('data:desc');
    this.page.set(1);
  }

  openCreate(): void {
    this.editing.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(op: IFundOperation): void {
    this.editing.set(op);
    this.drawerOpen.set(true);
  }

  async remove(op: IFundOperation): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir esta operação?',
      message: `${op.descricao || 'Operação'} de ${new Date(op.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}, resultado ${signed(op.resultado)}.\nOs rendimentos distribuídos por ela são revertidos e o histórico posterior é reprocessado.`,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok || !op.id) return;
    this.service.deleteFundOperation(op.id).subscribe({
      next: () => {
        this.toast.success('Operação excluída e rendimentos revertidos.');
        this.reload();
      },
      error: (err) => this.toast.error(err.error?.message || 'Não foi possível excluir.'),
    });
  }

  fmtSigned = signed;
}
