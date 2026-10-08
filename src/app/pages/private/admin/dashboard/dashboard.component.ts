import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexDataLabels, ApexStroke, ApexGrid, ApexTooltip, ApexFill, ApexLegend } from "ng-apexcharts";
import { Observable, BehaviorSubject, switchMap, tap } from 'rxjs';
import { PerformanceService, IDashboardSummary, IKPIs, IRendimento, IChartData } from '../../../../services/performance.service'; // Importe o serviço e as interfaces
import { AbbreviateNumberPipe } from '../../../../pipes/abbreviate-number.pipe';
import { CompactNumberPipe } from "../../../../pipes/compact-number-pipe.pipe";
import { CompactPercentPipe } from "../../../../pipes/compact-percent.pipe";

// Tipo para as opções do gráfico
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
    yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  fill: ApexFill;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, AbbreviateNumberPipe, CompactNumberPipe, CompactPercentPipe],
  providers: [DatePipe, AbbreviateNumberPipe],
  template: `
 <ng-container *ngIf="(dashboardData$ | async) as data; else loading">

  <section class="flex flex-wrap justify-between items-center gap-4 mb-8">
    <div>
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Visão Geral</h2>
      <p class="text-slate-500 dark:text-slate-400">Dados consolidados da plataforma.</p>
    </div>
    <div class="flex space-x-2">
      <button *ngFor="let f of filtros" (click)="selecionarFiltro(f)"
        [ngClass]="(filtroSelecionado$ | async) === f ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600">
        {{ f }}
      </button>
    </div>
  </section>

  <section class="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-6 mb-8">



    <div
      class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-blue-500/10 hover:-translate-y-1">
      <div class="flex items-center justify-between">
        <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Saldo Investido</h3>
        <span class="p-2 bg-blue-500/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="h-5 w-5 text-blue-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-7.5-3.75L21 7.5m0 0L16.5 3M21 7.5H3" />
          </svg>
        </span>
      </div>
      <p class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate mt-2">
        {{ data.kpis.patrimonioTotal | compactNumber }}
      </p>
    </div>

    <div
      class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-green-500/10 hover:-translate-y-1">
      <div class="flex items-center justify-between">
        <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Lucro (Período)</h3>
        <span class="p-2 bg-green-500/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="h-5 w-5 text-green-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 18 9-9 4.5 4.5L21 6" />
          </svg>
        </span>
      </div>
      <p class="text-2xl sm:text-3xl font-bold truncate mt-2"
        [ngClass]="data.kpis.lucroPercentual >= 0 ? 'text-green-500' : 'text-red-500'">
        {{ data.kpis.lucroPercentual | compactPercent }}
      </p>
    </div>

    <div
      class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-yellow-500/10 hover:-translate-y-1">
      <div class="flex items-center justify-between">
        <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Usuários Ativos</h3>
        <span class="p-2 bg-yellow-500/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="h-5 w-5 text-yellow-500">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.53-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </span>
      </div>
      <p class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate mt-2">
        {{ data.kpis.usuariosAtivos }}
      </p>
    </div>

    <div
      class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:-translate-y-1">
      <div class="flex items-center justify-between">
        <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Operações</h3>
        <span class="p-2 bg-indigo-500/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="h-5 w-5 text-indigo-500">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </span>
      </div>
      <p class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate mt-2">
        {{ data.kpis.totalOperacoes }}
      </p>
    </div>

  </section>


  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

    <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Evolução da Rentabilidade</h3>
      <div>
        <apx-chart #chart [series]="chartOptions?.series || []"
          [chart]="chartOptions?.chart || { height: 350, type: 'line' }" [xaxis]="chartOptions?.xaxis || {}"
          [stroke]="chartOptions?.stroke || {}" [tooltip]="chartOptions?.tooltip || {}"
          [dataLabels]="chartOptions?.dataLabels || {}" [grid]="chartOptions?.grid || {}"
          [fill]="chartOptions?.fill || {}" [legend]="chartOptions?.legend || {}" [colors]="chartOptions?.colors || []">
        </apx-chart>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Performance (Período)</h3>
      <div class="space-y-4">

        <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700/80">
          <p class="text-sm text-slate-500 dark:text-slate-400">Rendimento (R$)</p>
          <p class="text-2xl font-bold mt-1" [ngClass]="data.rendimento.lucroReais >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ data.rendimento.lucroReais | compactNumber }}</p>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700/80">
          <p class="text-sm text-slate-500 dark:text-slate-400">Rentabilidade (%)</p>
          <p class="text-2xl font-bold mt-1"
            [ngClass]="data.rendimento.lucroPercentual >= 0 ? 'text-green-500' : 'text-red-500'">{{
            data.rendimento.lucroPercentual | compactPercent }}</p>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700/80">
          <p class="text-sm text-slate-500 dark:text-slate-400">% sobre o CDI</p>
          <p class="text-2xl font-bold mt-1"
            [ngClass]="data.rendimento.percentualSobreCDI >= 0 ? 'text-green-500' : 'text-red-500'">{{
            data.rendimento.percentualSobreCDI | compactPercent }}</p>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700/80">
          <p class="text-sm text-slate-500 dark:text-slate-400">% sobre o IBOVESPA</p>
          <p class="text-2xl font-bold mt-1"
            [ngClass]="data.rendimento.percentualSobreIbov >= 0 ? 'text-green-500' : 'text-red-500'">{{
            data.rendimento.percentualSobreIbov | compactPercent }}</p>
        </div>

      </div>
    </div>
  </div>
</ng-container>

<ng-template #loading>
  <div class="flex flex-col items-center justify-center py-20 space-y-4">
    <div class="h-10 w-10 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>

    <p class="text-slate-600 dark:text-slate-300 text-lg font-medium">
      A carregar dados do dashboard...
    </p>
  </div>
</ng-template>`,
})
export class AdminDashboardComponent implements OnInit {
 // Propriedade para guardar os últimos dados recebidos
  private latestChartData: IChartData | undefined;

private _chart!: ChartComponent;
  @ViewChild("chart") set chart(chart: ChartComponent) {
    if (chart) {
      this._chart = chart;
      if (this.latestChartData) {
        this.updateChart(this.latestChartData);
      }
    }
  }


  public chartOptions: Partial<ChartOptions>;

  // Gerencia o estado do filtro
 filtros = [ 'Mês', 'Desde o início'];
    filtroSelecionado$ = new BehaviorSubject<string>('Desde o início');

  // Observable que busca os dados da API sempre que o filtro muda
  dashboardData$: Observable<IDashboardSummary>;

  constructor(
    private readonly router: Router,
    private readonly performanceService: PerformanceService // Injeta o serviço
  ) {
   this.dashboardData$ = this.filtroSelecionado$.pipe(
      switchMap(period => this.performanceService.getDashboardSummary(period)),
      tap(data => {
        this.latestChartData = data.chartData;
        this.updateChart(data.chartData);
      })
    );

 this.chartOptions = {
      series: [],
      chart: { height: 350, type: "area", toolbar: { show: false }, foreColor: '#94a3b8' },
      colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] }},
      grid: { borderColor: '#334155', strokeDashArray: 4 },
      xaxis: { categories: [], axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1000000) {
            return `${(val / 1000000).toFixed(1)}M`; // Ex: 1.2M
          }
          if (val >= 1000) {
            return `${(val / 1000).toFixed(0)}k`; // Ex: 150k
          }
          return `${val.toFixed(0)}`;
        },
      },
    },

    // --- CONFIGURAÇÃO CORRETA DO TOOLTIP ---
    tooltip: {
  theme: 'dark',
  y: {
    // Formata o valor como porcentagem com duas casas decimais
    formatter: (val: number) => {
      // Retorna uma string vazia ou um traço se o valor for nulo/undefined para evitar erros
      if (val === null || val === undefined) {
        return '-';
      }
      return val.toFixed(2) + '%';
    }
  }
},

    legend: { show: true, position: 'top', horizontalAlign: 'right' }
  };
    };

  ngOnInit(): void {
    // A lógica de carregamento agora é tratada pelo Observable dashboardData$
  }

  selecionarFiltro(filtro: string): void {
    this.filtroSelecionado$.next(filtro); // Emite um novo valor para o filtro, que dispara a chamada à API
  }
updateChart(chartData?: IChartData): void {
  // Se não houver dados, não fazemos nada.
  if (!chartData) {
    return;
  }

  // 1. ATUALIZA O ESTADO: Guardamos as novas séries e categorias no chartOptions.
  // Isso garante consistência com o template do Angular.
  this.chartOptions = {
    ...this.chartOptions,
    series: chartData.series,
    xaxis: {
      ...this.chartOptions.xaxis,
      categories: chartData.categories,
    },
  };

  // 2. DÁ O COMANDO: Se o gráfico já existe na tela, forçamos a atualização visual.
  if (this._chart) {
    this._chart.updateOptions({
      series: chartData.series,
      xaxis: {
        categories: chartData.categories,
      },
      // ADICIONE ESTAS DUAS PROPRIEDADES PARA GARANTIR A FORMATAÇÃO
      yaxis: this.chartOptions.yaxis,
      tooltip: this.chartOptions.tooltip,
    });
  }
}

  navegarParaOperacoes(): void {
    this.router.navigate(['/admin/operacoes']);
  }
}
