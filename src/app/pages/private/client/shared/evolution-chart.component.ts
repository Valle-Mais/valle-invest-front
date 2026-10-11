import { Component, computed, inject, input, signal } from '@angular/core';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { ThemeService } from '../../../../services/theme.service';
import { IChartSeries } from '../../../../services/performance.service';

type Mode = 'percent' | 'reais';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Evolução da carteira: % acumulado (vs CDI e Ibovespa) ou patrimônio em R$. */
@Component({
  selector: 'app-evolution-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <h3 class="text-lg font-bold text-text">{{ mode() === 'percent' ? 'Rentabilidade acumulada' : 'Evolução do patrimônio' }}</h3>
      @if (seriesReais().length > 0) {
      <div class="inline-flex items-center gap-1 rounded-lg bg-surface-alt p-1" role="tablist">
        <button type="button" role="tab" [attr.aria-selected]="mode() === 'percent'" (click)="mode.set('percent')"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                [class]="mode() === 'percent' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-muted hover:text-text'">% acumulado</button>
        <button type="button" role="tab" [attr.aria-selected]="mode() === 'reais'" (click)="mode.set('reais')"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                [class]="mode() === 'reais' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-muted hover:text-text'">R$</button>
      </div>
      }
    </div>
    @if (categories().length > 1) {
      <apx-chart
        [series]="options().series!"
        [chart]="options().chart!"
        [xaxis]="options().xaxis!"
        [yaxis]="options().yaxis!"
        [stroke]="options().stroke!"
        [fill]="options().fill!"
        [colors]="options().colors!"
        [grid]="options().grid!"
        [legend]="options().legend!"
        [tooltip]="options().tooltip!"
        [dataLabels]="options().dataLabels!"
        [theme]="options().theme!"
      />
    } @else {
      <p class="py-10 text-center text-sm text-text-muted">Ainda não há meses suficientes para traçar a evolução.</p>
    }
  `,
  host: { class: 'block' },
})
export class EvolutionChartComponent {
  private readonly theme = inject(ThemeService);

  readonly categories = input<string[]>([]);
  readonly seriesPercent = input<IChartSeries[]>([]);
  readonly seriesReais = input<IChartSeries[]>([]);

  readonly mode = signal<Mode>('percent');

  readonly options = computed<ApexOptions>(() => {
    const dark = this.theme.theme() === 'dark';
    const percent = this.mode() === 'percent';
    const series = percent ? this.seriesPercent() : this.seriesReais();
    const primary = cssVar('--vl-primary') || '#1e462e';
    const accent = cssVar('--vl-accent') || '#c7a84c';
    const muted = cssVar('--vl-text-muted') || '#64748b';
    const border = cssVar('--vl-border') || '#e3e0d6';

    return {
      series: series.map((s) => ({ name: s.name, data: s.data })),
      chart: { type: 'area', height: 320, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif', foreColor: muted, animations: { enabled: false } },
      theme: { mode: dark ? 'dark' : 'light' },
      colors: percent ? [primary, accent, muted] : [primary],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      grid: { borderColor: border, strokeDashArray: 4, padding: { left: 8, right: 8 } },
      legend: { show: percent, position: 'top', horizontalAlign: 'right' },
      xaxis: { categories: this.categories(), axisBorder: { show: false }, axisTicks: { show: false }, labels: { rotate: 0, hideOverlappingLabels: true, trim: true }, tickAmount: 8 },
      yaxis: { labels: { formatter: (v: number) => (percent ? `${v.toFixed(0)}%` : brl.format(v)) } },
      tooltip: { shared: true, y: { formatter: (v: number) => (percent ? `${v.toFixed(2)}%` : brl.format(v)) } },
    };
  });
}
