import { CompactPercentPipe } from './../../../../pipes/compact-percent.pipe';
import { Component, OnDestroy, ViewChild, } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NgApexchartsModule } from "ng-apexcharts";
import { BehaviorSubject, Observable, map, startWith, switchMap, combineLatest, of, catchError, tap, Subscription, shareReplay, filter, forkJoin } from 'rxjs';
import { IDashboardData, PerformanceService } from '../../../../services/performance.service';
import { IUser, ClientsService } from '../../../../services/clients.service';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { AuthService } from '../../../../services/auth.service';

import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexTooltip, ApexGrid, ApexFill, ApexLegend } from 'ng-apexcharts';
import { ChartComponent } from "ng-apexcharts";


import localePt from '@angular/common/locales/pt';
import { CdiService } from '../../../../services/cdi.service';
import { CompactNumberPipe } from "../../../../pipes/compact-number-pipe.pipe";

registerLocaleData(localePt);


interface PerformanceYear {
  year: number;
  items: {
    label: 'Minha Carteira' | 'CDI' | 'Ibovespa';
    monthlyValues: (number | null)[];
    annualTotal: number;
  }[];
}

export interface ViewState<T> {
  loading: boolean;
  data: T | null;
  error: any | null;
  hasSelection: boolean;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgApexchartsModule, CompactNumberPipe, CompactPercentPipe],
  providers: [DatePipe],
  template: `
    <div class="space-y-8 font-sans">
      <!-- O cabeçalho só aparece quando o utilizador é carregado -->
      <ng-container *ngIf="(authService.currentUser$ | async) as user; else loadingTemplate">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-800 dark:text-white">{{ user.role === 'admin' ? 'Desempenho do Cliente' : 'Meu Desempenho' }}</h1>
            <p class="text-slate-500 dark:text-slate-400">{{ user.role === 'admin' ? 'Selecione um cliente para ver os detalhes.' : 'Acompanhe a evolução dos seus investimentos.' }}</p>
          </div>
          <div class="flex items-center gap-4">
              <select *ngIf="user.role === 'admin'" [formControl]="clientSelector" class="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                <option *ngFor="let client of (allClients$ | async)" [value]="client.id">{{ client.name }}</option>
              </select>
              <div class="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                  <button *ngFor="let f of filtros" (click)="selecionarFiltro(f)"
                    [ngClass]="(filtroSelecionado$ | async) === f ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'"
                    class="px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200">
                    {{ f }}
                  </button>
              </div>
          </div>
        </div>

        <!-- Container de Estado da Visualização -->
        <ng-container *ngIf="(viewState$ | async) as state">
          <div *ngIf="state.loading" class="flex flex-col items-center justify-center py-20 animate-pulse">
    <div class="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
    <p class="mt-4 text-slate-500 dark:text-slate-400 font-medium">Carregando dados...</p>
  </div>

  <!-- Erro -->
  <div *ngIf="!state.loading && state.error" class="text-center py-20 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 rounded-2xl p-6 shadow-lg">
    <h3 class="font-bold text-red-600 dark:text-red-400 text-lg">Ocorreu um erro</h3>
    <p class="text-red-500 dark:text-red-400 mt-2">Não foi possível carregar os dados. Tente novamente mais tarde.</p>
  </div>

  <!-- Nenhuma seleção -->
  <div *ngIf="!state.loading && !state.error && !state.hasSelection" class="text-center py-20 backdrop-blur-md bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 shadow-inner border border-slate-200 dark:border-slate-700">
    <h3 class="font-bold text-slate-700 dark:text-slate-200 text-lg">Nenhum cliente selecionado</h3>
    <p class="text-slate-500 dark:text-slate-400 mt-2">Por favor, selecione um cliente para ver o desempenho.</p>
  </div>
          <ng-container *ngIf="!state.loading && !state.error && state.hasSelection && state.data as data">

          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Card Saldo Atual -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-shadow duration-300 border border-transparent dark:hover:border-emerald-500/30">
                  <div class="flex items-center gap-4">
                    <div class="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full"><svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 21v-1m0-18v-1m0 18a9 9 0 100-18 9 9 0 000 18z"></path></svg></div>
                    <div>
                      <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Saldo Atual</h3>
                      <p class="text-2xl font-bold text-emerald-500 mt-1">{{ data.cardData.saldoAtual | compactNumber }}</p>
                    </div>
                  </div>
                </div>
                <!-- Card Rendimento -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-green-500/20 transition-shadow duration-300 border border-transparent dark:hover:border-green-500/30">
                   <div class="flex items-center gap-4">
                    <div class="p-3 rounded-full" [ngClass]="data.cardData.rendimentoReais >= 0 ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'"><svg class="w-6 h-6" [ngClass]="data.cardData.rendimentoReais >= 0 ? 'text-green-500' : 'text-red-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></div>
                    <div>
                      <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Rendimento (R$)</h3>
                      <p class="text-2xl font-bold mt-1" [ngClass]="data.cardData.rendimentoReais >= 0 ? 'text-green-500' : 'text-red-500'">{{ data.cardData.rendimentoReais | currency:'BRL' }}</p>
                    </div>
                  </div>
                </div>
                <!-- Card Rentabilidade -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300 border border-transparent dark:hover:border-blue-500/30">
                  <div class="flex items-center gap-4">
                    <div class="p-3 rounded-full" [ngClass]="data.cardData.rentabilidadePercentual >= 0 ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-red-100 dark:bg-red-500/20'"><svg class="w-6 h-6" [ngClass]="data.cardData.rentabilidadePercentual >= 0 ? 'text-blue-500' : 'text-red-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg></div>
                    <div>
                      <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Rentabilidade</h3>
                      <p class="text-2xl font-bold mt-1" [ngClass]="data.cardData.rentabilidadePercentual >= 0 ? 'text-blue-500' : 'text-red-500'">{{ data.cardData.rentabilidadePercentual | compactPercent }}</p>
                    </div>
                  </div>
                </div>
                <!-- Card % CDI -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-shadow duration-300 border border-transparent dark:hover:border-indigo-500/30">
                  <div class="flex items-center gap-4">
                    <div class="p-3 rounded-full" [ngClass]="data.cardData.percentualSobreCDI >= 1 ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-orange-100 dark:bg-orange-500/20'"><svg class="w-6 h-6" [ngClass]="data.cardData.percentualSobreCDI >= 1 ? 'text-indigo-500' : 'text-orange-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                    <div>
                      <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">% sobre o CDI</h3>
                      <p class="text-2xl font-bold mt-1" [ngClass]="data.cardData.percentualSobreCDI >= 1 ? 'text-indigo-500' : 'text-orange-500'">{{ data.cardData.percentualSobreCDI | compactPercent }}</p>
                    </div>
                  </div>
                </div>

                 <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-shadow duration-300 border border-transparent dark:hover:border-indigo-500/30">
                  <div class="flex items-center gap-4">
                    <div class="p-3 rounded-full" [ngClass]="data.cardData.percentualSobreIbov >= 1 ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-orange-100 dark:bg-orange-500/20'"><svg class="w-6 h-6" [ngClass]="data.cardData.percentualSobreIbov >= 1 ? 'text-indigo-500' : 'text-orange-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div>
                    <div>
                      <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">% sobre o Ibovespa</h3>
                      <p class="text-2xl font-bold mt-1" [ngClass]="data.cardData.percentualSobreIbov >= 1 ? 'text-indigo-500' : 'text-orange-500'">{{ data.cardData.percentualSobreIbov | compactPercent }}</p>
                    </div>
                  </div>
                </div>




            </section>

            <div class="grid grid-cols-1 lg:grid-cols-1 gap-8">
              <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Evolução do Patrimônio vs. CDI</h3>
               <div>
  <apx-chart
    #chart
    [series]="chartOptions?.series || []"
    [chart]="chartOptions?.chart || { height: 350, type: 'line' }"
    [xaxis]="chartOptions?.xaxis || {}"
    [stroke]="chartOptions?.stroke || {}"
    [tooltip]="chartOptions?.tooltip || {}"
    [dataLabels]="chartOptions?.dataLabels || {}"
    [grid]="chartOptions?.grid || {}"
    [fill]="chartOptions?.fill || {}"
    [legend]="chartOptions?.legend || {}"
    [colors]="chartOptions?.colors || []">
  </apx-chart>
</div>
  <div class="mt-8 space-y-4">
    <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Operações</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button (click)="openRequestPanel('Aporte')"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Solicitar Aporte</span>
      </button>

      <button (click)="openRequestPanel('Resgate')"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
        </svg>
        <span>Solicitar Resgate</span>
      </button>
    </div>
  </div>
              </div>

              <!-- <div class="space-y-4">
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Operações</h3>
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
                    <button (click)="openRequestPanel('Aporte')" class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span>Solicitar Aporte</span></button>
                    <button (click)="openRequestPanel('Resgate')" class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg><span>Solicitar Resgate</span></button>
                </div>
              </div> -->
                 <!-- table com comparação do fundo com CDI -->

<div class="lg:col-span-3  font-sans">
  <!-- Header mais neutro -->
  <div class="bg-slate-700 dark:bg-slate-700 rounded-t-xl p-6 shadow-lg">
    <h2 class="text-xl font-bold text-white">Rentabilidade</h2>
    <p class="text-sm text-slate-300">Comparação de Performance: Fundo vs CDI</p>
  </div>

  <div class="bg-white dark:bg-slate-900 rounded-b-xl shadow-lg">
    <div class="overflow-x-auto">
      <table class="w-full text-base text-center">
        <thead class="text-sm text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40">
          <tr>
            <th class="px-4 py-3" scope="col"></th>
            <th class="px-4 py-3" scope="col"></th>
            <th *ngFor="let month of months" class="px-4 py-3 font-semibold" scope="col">{{ month }}</th>
            <th class="px-4 py-3 font-semibold bg-slate-100 dark:bg-slate-800/70" scope="col">ANO</th>
          </tr>
        </thead>

       <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
  <ng-container *ngFor="let yearData of (tableData$ | async)">
    <tr *ngFor="let item of yearData.items; let isFirst = first" class="dark:text-slate-300">


              <!-- Coluna do Ano -->
              <td *ngIf="isFirst"
                  [attr.rowspan]="yearData.items.length"
                  class="bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 font-bold text-base align-middle border-r border-slate-200 dark:border-slate-800">
                {{ yearData.year }}
              </td>

              <!-- Label -->
              <td class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {{ item.label }}
              </td>

              <!-- Valores Mensais -->
              <td *ngFor="let value of item.monthlyValues"
                  class="px-4 py-3 font-mono"
                  [ngClass]="{
                    'text-green-600 dark:text-green-500': value !== null && value > 0,
                    'text-red-600 dark:text-red-500': value !== null && value < 0
                  }">
                {{ value !== null ? (value / 100 | percent:'1.2-2':'pt-BR') : '-' }}
              </td>

              <!-- Total Anual -->
              <td class="px-4 py-3 font-mono font-bold bg-yellow-50 dark:bg-yellow-900/20"
                  [ngClass]="{
                    'text-green-600 dark:text-green-500': item.annualTotal > 0,
                    'text-red-600 dark:text-red-500': item.annualTotal < 0
                  }">
                {{ item.annualTotal / 100 | percent:'1.2-2':'pt-BR' }}
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
    </div>

    <!-- Legenda -->
    <div class="flex flex-wrap items-center justify-center gap-6 p-4 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-sm bg-green-500"></span>
        <span class="text-xs text-slate-600 dark:text-slate-400">Rentabilidade Positiva</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-sm bg-red-500"></span>
        <span class="text-xs text-slate-600 dark:text-slate-400">Rentabilidade Negativa</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-sm bg-yellow-300 dark:bg-yellow-500/30 border border-yellow-400/50"></span>
        <span class="text-xs text-slate-600 dark:text-slate-400">Totais Anuais</span>
      </div>
    </div>
  </div>
</div>
            </div>
          </ng-container>
        </ng-container>

        <!-- Seção de Solicitações Pendentes -->
        <div *ngIf="user.role === 'client' && (pendingRequests$ | async) as requests" class="space-y-4">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Minhas Solicitações Pendentes</h3>
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div *ngIf="requests.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
                Você não possui solicitações pendentes.
              </div>
              <div *ngIf="requests.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div *ngFor="let req of requests" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-transform hover:scale-105 hover:shadow-md">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                       <span class="px-2 py-1 text-xs font-semibold rounded-full"
                        [ngClass]="req.tipo === 'Aporte' ? 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300' : 'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300'">
                        {{ req.tipo }}
                      </span>
                      <span class="font-medium text-slate-500 dark:text-slate-400 text-xs">{{ req.data | date:'dd/MM/yyyy':'UTC'}}</span>
                    </div>
                    <p class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ req.valor | currency:'BRL' }}</p>
                  </div>
                   <div class="text-right mt-2">
                     <span class="text-xs font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-end gap-1">
                       <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       Pendente
                     </span>
                   </div>
                </div>
              </div>
            </div>
        </div>

      </ng-container>

      <ng-template #loadingTemplate>
        <div class="text-center py-20">
          <p class="text-slate-500 dark:text-slate-400">A verificar autenticação...</p>
        </div>
      </ng-template>

      <!-- Overlay e Painel Lateral (Modal) -->
      <div *ngIf="isPanelOpen" (click)="closePanel()" class="fixed inset-0 bg-black/60 z-40 transition-opacity"></div>
      <aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
             [class.translate-x-0]="isPanelOpen" [class.translate-x-full]="!isPanelOpen">
        <div class="flex flex-col h-full">
          <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ panelTitle }}</h3>
            <button (click)="closePanel()" class="text-slate-400 hover:text-slate-500 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <form [formGroup]="requestForm" (ngSubmit)="submitRequest()" class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            <div>
              <label for="valor" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
              <input type="number" id="valor" formControlName="valor" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" required>
              <div *ngIf="requestForm.get('valor')?.invalid && requestForm.get('valor')?.touched" class="text-red-500 text-xs mt-1">Por favor, insira um valor válido.</div>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Sua solicitação será enviada para análise do administrador.</p>
          </form>
          <div class="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <button type="button" (click)="submitRequest()" [disabled]="requestForm.invalid" class="w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed">Enviar Solicitação</button>
          </div>
        </div>
      </aside>
    </div>
  `
})
export class ClientDashboardComponent implements OnDestroy {
  @ViewChild("chart") private _chart!: ChartComponent;

  // Propriedades da UI
  isPanelOpen = false;
  panelTitle = '';
  requestForm: FormGroup;

  // Observables para o Template
  allClients$: Observable<IUser[]>;
  viewState$: Observable<ViewState<IDashboardData>>;
  pendingRequests$: Observable<IClientTransaction[]>;

  // Controles de Filtro
  filtros = [ 'Mês', 'Desde o início'];
  filtroSelecionado$ = new BehaviorSubject<string>('Desde o início');
  clientSelector: FormControl<string | null>;

  // Configurações do Gráfico e Tabela
  public chartOptions: Partial<ChartOptions>;
  public tableData$ = new BehaviorSubject<PerformanceYear[]>([]);
  private latestChartData: { categories: string[], series: any[] } | undefined;

  private destroySub = new Subscription();
  public readonly months: string[] = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private performanceService: PerformanceService,
    private clientsService: ClientsService,
    private clientTransactionsService: ClientTransactionsService,
  ) {
    this.chartOptions = {
      series: [],
      chart: { height: 350, type: "area", toolbar: { show: false }, foreColor: '#94a3b8' },
      colors: ['#10b981', '#3b82f6', '#8b5cf6'], // Minha Carteira, CDI, Ibovespa
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] }},
      grid: { borderColor: '#334155', strokeDashArray: 4 },
      xaxis: { categories: [], axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { formatter: (val: number) => `${val.toFixed(0)}%` }},
      tooltip: { theme: 'dark', y: { formatter: (val: number) => val.toFixed(2) + '%' }},
      legend: { show: true, position: 'top', horizontalAlign: 'right' }
    };

    this.requestForm = this.fb.group({
      valor: [null, [Validators.required, Validators.min(1)]]
    });
    this.clientSelector = this.fb.control(null as string | null);

    // --- LÓGICA REATIVA ---

    this.allClients$ = this.authService.currentUser$.pipe(
      filter((user): user is IUser => !!user && user.role === 'admin'),
      switchMap(() => this.clientsService.getClients()),
      map(clients => clients.filter(c => c.role === 'client' && c.status === 'Ativo')),
      tap(clients => {
        if (clients.length > 0 && !this.clientSelector.value) {
          this.clientSelector.setValue(clients[0].id);
        }
      }),
      shareReplay(1)
    );

    const effectiveClientId$ = this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        return user.role === 'admin'
          ? this.clientSelector.valueChanges.pipe(startWith(this.clientSelector.value))
          : of(user.id);
      })
    );

    this.viewState$ = combineLatest([effectiveClientId$, this.filtroSelecionado$]).pipe(
      switchMap(([clientId, period]) => {
        if (!clientId) {
          return of({ loading: false, data: null, error: null, hasSelection: false });
        }
        return this.performanceService.getPerformanceDashboard(clientId, period).pipe(
          map(dashboardData => {
            this.tableData$.next(dashboardData.tableData as PerformanceYear[]);
            return { loading: false, data: dashboardData, error: null, hasSelection: true };
          }),
          startWith({ loading: true, data: null, error: null, hasSelection: true }),
          catchError((error: any) => of({ loading: false, data: null, error: error, hasSelection: true }))
        );
      }),
      tap(state => {
        this.latestChartData = state.data?.chartData;
        this.updateChart();
      }),
      shareReplay(1)
    );

    this.pendingRequests$ = this.authService.currentUser$.pipe(
      filter((user): user is IUser => !!user && user.role === 'client'),
      switchMap(user => this.clientTransactionsService.getClientTransactions({ clientId: user.id }).pipe(
        map(transactions => transactions
            .filter(t => t.status === 'Pendente')
            .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        )
      ))
    );
  }

  ngOnDestroy(): void { this.destroySub.unsubscribe(); }

  updateChart(): void {
    if (!this.latestChartData) return;
    this.chartOptions = {
        ...this.chartOptions,
        series: this.latestChartData.series,
        xaxis: {
            ...this.chartOptions.xaxis,
            categories: this.latestChartData.categories,
        },
    };
    if (this._chart) {
        this._chart.updateOptions({
            series: this.latestChartData.series,
            xaxis: { categories: this.latestChartData.categories }
        });
    }
  }

  selecionarFiltro(filtro: string): void { this.filtroSelecionado$.next(filtro); }

  openRequestPanel(type: 'Aporte' | 'Resgate'): void {
    this.panelTitle = `Solicitar ${type}`;
    this.requestForm.reset();
    this.isPanelOpen = true;
  }

  closePanel(): void { this.isPanelOpen = false; }

  submitRequest(): void {
    if (this.requestForm.invalid) return;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;
    const clientId = currentUser.id; // Cliente só pode fazer para si mesmo
    if (!clientId) return;
    // Só os campos do DTO da API. clientName e status são definidos lá:
    // a solicitação sai sempre em nome do usuário autenticado, como Pendente.
    const requestData: Partial<IClientTransaction> = {
        clientId: clientId,
        tipo: this.panelTitle.includes('Aporte') ? 'Aporte' : 'Resgate',
        valor: this.requestForm.value.valor,
        data: new Date().toISOString(),
    };
    this.clientTransactionsService.createRequest(requestData).subscribe({
        next: () => this.closePanel(),
        error: (err: any) => console.error('Erro ao enviar solicitação', err)
    });
  }
}
