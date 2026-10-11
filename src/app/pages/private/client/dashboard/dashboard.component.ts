import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { IDashboardData, PerformanceService } from '../../../../services/performance.service';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { ClientsService } from '../../../../services/clients.service';
import {
  VlButtonComponent,
  VlFieldComponent,
  VlInputDirective,
  VlKpiCardComponent,
  VlPageHeaderComponent,
  VlPeriodSelectorComponent,
  VlSkeletonComponent,
} from '../../../../ui';
import { LucideAngularModule } from 'lucide-angular';
import { EvolutionChartComponent } from '../shared/evolution-chart.component';
import { PerformanceTableComponent } from '../shared/performance-table.component';
import { RequestDrawerComponent } from '../shared/request-drawer.component';
import { formatBrl, formatPercent, signed } from '../../../../shared/format';

/**
 * Painel do cliente: "quanto tenho e quanto rendeu".
 * Também é usado pelo admin em /admin/client-view, com um seletor de cliente
 * e sem as ações de solicitação (que só fazem sentido para o próprio cliente).
 */
@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    VlPageHeaderComponent,
    VlKpiCardComponent,
    VlPeriodSelectorComponent,
    VlButtonComponent,
    VlFieldComponent,
    VlInputDirective,
    VlSkeletonComponent,
    EvolutionChartComponent,
    PerformanceTableComponent,
    RequestDrawerComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class ClientDashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly performance = inject(PerformanceService);
  private readonly transactions = inject(ClientTransactionsService);
  private readonly clientsService = inject(ClientsService);

  /** Quando informado (página de detalhe do admin), fixa o cliente e esconde o seletor. */
  readonly clientIdInput = input<string | undefined>(undefined, { alias: 'clientId' });
  /** Embutido em outra página: sem cabeçalho próprio. */
  readonly embedded = input(false);

  readonly isAdmin = computed(() => this.auth.role() === 'admin');

  /** Lista de clientes, só para o admin escolher quem ver. */
  readonly clients = toSignal(
    this.auth.currentUser$.pipe(
      switchMap((u) => (u?.role === 'admin' && !this.clientIdInput() ? this.clientsService.getClients() : of([]))),
    ),
    { initialValue: [] },
  );
  readonly selectedClientId = signal<string | null>(null);
  readonly activeClients = computed(() => this.clients().filter((c) => c.role === 'client' && c.status === 'Ativo'));

  readonly clientId = computed(() => this.clientIdInput() ?? (this.isAdmin() ? this.selectedClientId() : this.auth.getUserId()));
  readonly showSelector = computed(() => this.isAdmin() && !this.clientIdInput());
  readonly period = signal('inicio');

  readonly data = signal<IDashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pending = signal<IClientTransaction[]>([]);
  readonly requestOpen = signal(false);
  readonly requestType = signal<'Aporte' | 'Resgate'>('Aporte');

  // Derivados para os cards
  readonly cards = computed(() => {
    const d = this.data()?.cardData;
    if (!d) return null;
    const rendimento = d.rendimentoReais;
    return {
      saldo: formatBrl(d.saldoAtual),
      delta: `${signed(rendimento)} · ${rendimento >= 0 ? '+' : ''}${formatPercent(d.rentabilidadePercentual)}`,
      rentabilidade: formatPercent(d.rentabilidadePercentual),
      cdi: formatPercent(d.percentualSobreCDI),
      ibov: formatPercent(d.percentualSobreIbov),
      toneRent: tone(d.rentabilidadePercentual),
      toneCdi: tone(d.percentualSobreCDI - 1),
      toneIbov: tone(d.percentualSobreIbov - 1),
    };
  });

  readonly periodLabel = computed(() => ({ mes: 'no mês', '6m': 'em 6 meses', ano: 'no ano', inicio: 'desde o início' })[this.period()] ?? '');

  constructor() {
    // Primeiro cliente ativo selecionado por padrão, para o admin.
    effect(() => {
      const first = this.activeClients()[0];
      if (this.isAdmin() && !this.selectedClientId() && first) {
        this.selectedClientId.set(first.id);
      }
    });

    // Recarrega quando cliente ou período mudam.
    effect(() => {
      const id = this.clientId();
      const period = this.period();
      untracked(() => this.load(id, period));
    });

    effect(() => {
      if (!this.isAdmin()) untracked(() => this.loadPending());
    });
  }

  private load(clientId: string | null, period: string): void {
    if (!clientId) {
      this.loading.set(false);
      this.data.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.performance.getPerformanceDashboard(clientId, period).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar seus dados. Tente novamente em instantes.');
        this.loading.set(false);
      },
    });
  }

  private loadPending(): void {
    const id = this.auth.getUserId();
    if (!id) return;
    this.transactions.getClientTransactions({ clientId: id, status: 'Pendente' }).subscribe({
      next: (list) => this.pending.set(list),
      error: () => this.pending.set([]),
    });
  }

  reload(): void {
    this.load(this.clientId(), this.period());
    if (!this.isAdmin()) this.loadPending();
  }

  openRequest(tipo: 'Aporte' | 'Resgate'): void {
    this.requestType.set(tipo);
    this.requestOpen.set(true);
  }

  onRequestCreated(): void {
    this.loadPending();
  }

  fmtBrl = formatBrl;
}

function tone(v: number): 'positive' | 'negative' | 'neutral' {
  if (v > 0) return 'positive';
  if (v < 0) return 'negative';
  return 'neutral';
}
