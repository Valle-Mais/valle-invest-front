import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClientTransactionsService, IClientTransaction, TransactionType } from '../../../../services/client-transactions.service';
import { ToastService, VlBadgeComponent, VlButtonComponent, VlEmptyStateComponent, VlFieldComponent, VlInputDirective, VlPageHeaderComponent, VlPeriodSelectorComponent, VlSkeletonComponent } from '../../../../ui';
import { MONTHS_LONG, formatBrl, periodStart, signed, todayLocalIso } from '../../../../shared/format';

interface MonthGroup {
  key: string;
  label: string;
  net: number;
  items: IClientTransaction[];
}

/** Extrato do cliente: aprovadas, agrupadas por mês, com saldo após cada lançamento vindo da API. */
@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, VlPageHeaderComponent, VlPeriodSelectorComponent, VlFieldComponent, VlInputDirective, VlButtonComponent, VlBadgeComponent, VlEmptyStateComponent, VlSkeletonComponent],
  templateUrl: './statement.component.html',
})
export class StatementComponent {
  private readonly auth = inject(AuthService);
  private readonly transactions = inject(ClientTransactionsService);
  private readonly toast = inject(ToastService);

  readonly period = signal('inicio');
  readonly type = signal<'Todos' | TransactionType>('Todos');
  readonly all = signal<IClientTransaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filtered = computed(() => {
    const start = periodStart(this.period());
    const type = this.type();
    return this.all()
      .filter((t) => t.status === 'Aprovado')
      .filter((t) => type === 'Todos' || t.tipo === type)
      .filter((t) => !start || new Date(t.data) >= start);
  });

  readonly groups = computed<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const t of this.filtered()) {
      const d = new Date(t.data);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, '0')}`;
      let g = map.get(key);
      if (!g) {
        g = { key, label: `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`, net: 0, items: [] };
        map.set(key, g);
      }
      g.items.push(t);
      g.net += this.signedValue(t);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  });

  constructor() {
    effect(() => untracked(() => this.load()));
  }

  load(): void {
    const id = this.auth.getUserId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.transactions.getClientTransactions({ clientId: id, include: 'operation' }).subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o extrato.');
        this.loading.set(false);
      },
    });
  }

  signedValue(t: IClientTransaction): number {
    return t.tipo === 'Resgate' ? -t.valor : t.valor;
  }

  description(t: IClientTransaction): string {
    if (t.tipo === 'Rendimento') return t.operation?.descricao ? `Rendimento · ${t.operation.descricao}` : 'Rendimento';
    return t.tipo;
  }

  tone(t: IClientTransaction): 'positive' | 'negative' | 'accent' {
    return t.tipo === 'Resgate' ? 'negative' : t.tipo === 'Aporte' ? 'positive' : 'accent';
  }

  fmt = formatBrl;
  fmtSigned = signed;

  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) {
      this.toast.info('Nada para exportar com os filtros atuais.');
      return;
    }
    const header = ['Data', 'Tipo', 'Descrição', 'Valor', 'Saldo após'];
    const lines = rows.map((t) => [
      new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      t.tipo,
      this.description(t),
      this.signedValue(t).toFixed(2).replace('.', ','),
      t.saldoApos != null ? t.saldoApos.toFixed(2).replace('.', ',') : '',
    ]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-valle-${todayLocalIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Extrato exportado em CSV.');
  }
}
