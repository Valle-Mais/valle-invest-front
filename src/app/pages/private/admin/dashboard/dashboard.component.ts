import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { IDashboardSummary, PerformanceService } from '../../../../services/performance.service';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { FundOperationsService, IFundOperation } from '../../../../services/fund-operations.service';
import { VlBadgeComponent, VlButtonComponent, VlEmptyStateComponent, VlKpiCardComponent, VlPageHeaderComponent, VlPeriodSelectorComponent, VlSkeletonComponent } from '../../../../ui';
import { EvolutionChartComponent } from '../../client/shared/evolution-chart.component';
import { PendingRequestsComponent } from '../shared/pending-requests.component';
import { FundOperationDrawerComponent } from '../shared/fund-operation-drawer.component';
import { formatBrl, formatPercent, signed } from '../../../../shared/format';

/** Dashboard do admin: o que está pendente, o que mudou e como o fundo está indo. */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, LucideAngularModule, VlPageHeaderComponent, VlPeriodSelectorComponent, VlKpiCardComponent, VlButtonComponent, VlBadgeComponent, VlEmptyStateComponent, VlSkeletonComponent, EvolutionChartComponent, PendingRequestsComponent, FundOperationDrawerComponent],
  templateUrl: './dashboard.component.html',
})
export class AdminDashboardComponent {
  private readonly performance = inject(PerformanceService);
  private readonly transactions = inject(ClientTransactionsService);
  private readonly fundOps = inject(FundOperationsService);

  readonly period = signal('inicio');
  readonly summary = signal<IDashboardSummary | null>(null);
  readonly loadingSummary = signal(true);
  readonly pending = signal<IClientTransaction[]>([]);
  readonly loadingPending = signal(true);
  readonly lastOps = signal<IFundOperation[]>([]);
  readonly drawerOpen = signal(false);

  readonly periodLabel = computed(() => ({ mes: 'no mês', '6m': 'em 6 meses', ano: 'no ano', inicio: 'desde o início' })[this.period()] ?? '');

  readonly kpis = computed(() => {
    const s = this.summary();
    if (!s) return null;
    const r = s.rendimento.lucroPercentual;
    return {
      aum: formatBrl(s.kpis.patrimonioTotal),
      aumDelta: `${s.kpis.usuariosAtivos} ${s.kpis.usuariosAtivos === 1 ? 'cliente ativo' : 'clientes ativos'}`,
      rent: formatPercent(r),
      rentTone: r > 0 ? 'positive' : r < 0 ? 'negative' : 'neutral',
      rentDelta: `${formatPercent(s.rendimento.percentualSobreCDI)} do CDI`,
      fluxo: signed(s.kpis.fluxoLiquidoMes ?? 0),
      fluxoTone: (s.kpis.fluxoLiquidoMes ?? 0) >= 0 ? 'positive' : 'negative',
      pendentes: String(this.pending().length),
    } as const;
  });

  constructor() {
    effect(() => {
      const period = this.period();
      untracked(() => this.loadSummary(period));
    });
    this.loadPending();
    this.loadLastOps();
  }

  loadSummary(period = this.period()): void {
    this.loadingSummary.set(true);
    this.performance.getDashboardSummary(period).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loadingSummary.set(false);
      },
      error: () => this.loadingSummary.set(false),
    });
  }

  loadPending(): void {
    this.loadingPending.set(true);
    this.transactions.getClientTransactions({ status: 'Pendente' }).subscribe({
      next: (list) => {
        this.pending.set(list);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false),
    });
  }

  loadLastOps(): void {
    this.fundOps.getFundOperations({ page: 1, limit: 6, sortBy: 'data', sortOrder: 'desc' }).subscribe({
      next: (res) => this.lastOps.set(res.data),
      error: () => this.lastOps.set([]),
    });
  }

  onPendingChanged(): void {
    this.loadPending();
    this.loadSummary();
  }

  onOperationSaved(): void {
    this.loadLastOps();
    this.loadSummary();
  }

  fmtSigned = signed;
}
