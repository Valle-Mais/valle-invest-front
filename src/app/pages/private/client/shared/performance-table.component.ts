import { Component, computed, input, signal, effect } from '@angular/core';
import { IPerformanceYear } from '../../../../services/performance.service';
import { MONTHS_LONG, MONTHS_SHORT, formatPoints } from '../../../../shared/format';

const LABELS: Record<string, string> = { Fundo: 'Carteira', CDI: 'CDI', Ibovespa: 'Ibovespa' };

/** Rentabilidade mês a mês com anos em abas. Desktop: tabela com primeira coluna fixa. Mobile: lista por mês. */
@Component({
  selector: 'app-performance-table',
  standalone: true,
  templateUrl: './performance-table.component.html',
  host: { class: 'block' },
})
export class PerformanceTableComponent {
  readonly years = input<IPerformanceYear[]>([]);
  readonly selectedYear = signal<number | null>(null);

  readonly months = MONTHS_SHORT;
  readonly monthsLong = MONTHS_LONG;

  readonly current = computed(() => this.years().find((y) => y.year === this.selectedYear()) ?? this.years()[0] ?? null);

  /** Meses com algum valor, do mais recente para o mais antigo (lista do mobile). */
  readonly monthRows = computed(() => {
    const year = this.current();
    if (!year) return [];
    const rows: { month: number; values: (number | null)[] }[] = [];
    for (let m = 11; m >= 0; m--) {
      const values = year.items.map((i) => i.monthlyValues[m]);
      if (values.some((v) => v !== null && v !== undefined)) rows.push({ month: m, values });
    }
    return rows;
  });

  constructor() {
    effect(() => {
      const first = this.years()[0]?.year ?? null;
      if (this.selectedYear() === null || !this.years().some((y) => y.year === this.selectedYear())) {
        this.selectedYear.set(first);
      }
    });
  }

  label(key: string): string {
    return LABELS[key] ?? key;
  }

  fmt(v: number | null | undefined): string {
    return formatPoints(v);
  }

  tone(v: number | null | undefined): string {
    if (v == null) return 'text-text-muted';
    if (v > 0) return 'text-positive';
    if (v < 0) return 'text-negative';
    return 'text-text';
  }
}
