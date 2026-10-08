import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
// PercentPipe é necessário para a nova rentabilidade
import { CommonModule, DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith, Observable, switchMap, tap, shareReplay, Subscription, catchError, of } from 'rxjs';
import { IFundOperation, FundOperationsService, FundOperationFilters } from '../../../../services/fund-operations.service';
import { PerformanceService, IDashboardSummary } from '../../../../services/performance.service';
import { CompactNumberPipe } from "../../../../pipes/compact-number-pipe.pipe";
import { HttpErrorResponse } from '@angular/common/http';

@Component({
 selector: 'app-fund-operations',
 standalone: true,
  // Adicionei CurrencyPipe e PercentPipe para os cards
 imports: [CommonModule, ReactiveFormsModule, CompactNumberPipe, CurrencyPipe, PercentPipe],
 providers: [DatePipe],
 template: `
 <div class="space-y-10 font-sans">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Operações do Fundo</h1>
      <p class="text-slate-500 dark:text-slate-400">Registe os trades realizados pelo fundo.</p>
    </div>
    <button (click)="openPanel()" class="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>Registrar Operação</span>
    </button>
  </div>

  <ng-container *ngIf="dashboardData$ | async as dashboardData">
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-emerald-500/10 hover:-translate-y-1">
        <div class="flex items-center justify-between">
          <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Sob Gestão</h3>
          <span class="p-2 bg-emerald-500/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-emerald-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.21 12.77 10.5 12 10.5c-.77 0-1.536.71-2.121 1.256v-2.121c1.172-.879 2.303-.879 3.182 0l.659.879M12 6a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 0 2.25 2.25m0-7.5a2.25 2.25 0 0 1 2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25m0 7.5a2.25 2.25 0 0 0-2.25-2.25v-1.5a2.25 2.25 0 0 0 2.25-2.25m0 7.5a2.25 2.25 0 0 1 2.25-2.25v-1.5a2.25 2.25 0 0 1-2.25-2.25" />
            </svg>
          </span>
        </div>
        <p class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate mt-2">{{ dashboardData.kpis.patrimonioTotal | currency:'BRL' }}</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-green-500/10 hover:-translate-y-1">
        <div class="flex items-center justify-between">
          <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Lucro Realizado (Total)</h3>
          <span class="p-2 bg-green-500/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-green-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 9l4.5 4.5L21 6" />
            </svg>
          </span>
        </div>
        <p class="text-2xl sm:text-3xl font-bold truncate mt-2" [ngClass]="dashboardData.rendimento.lucroReais >= 0 ? 'text-green-500' : 'text-red-500'">{{ dashboardData.rendimento.lucroReais | currency:'BRL' }}</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-blue-500/10 hover:-translate-y-1">
        <div class="flex items-center justify-between">
          <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Rentabilidade (Total)</h3>
          <span class="p-2 bg-blue-500/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-blue-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl sm:text-3xl font-bold truncate mt-2" [ngClass]="dashboardData.kpis.lucroPercentual >= 0 ? 'text-blue-500' : 'text-red-500'">{{ dashboardData.kpis.lucroPercentual | percent:'1.2-2' }}</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:-translate-y-1">
        <div class="flex items-center justify-between">
          <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total de Operações</h3>
          <span class="p-2 bg-indigo-500/10 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-indigo-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate mt-2">{{ dashboardData.kpis.totalOperacoes }}</p>
      </div>

    </section>
  </ng-container>

  <section class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-800">
    <form [formGroup]="filterForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <div>
        <label for="startDate" class="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">De</label>
        <input type="date" id="startDate" formControlName="startDate" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 p-2.5">
      </div>
      <div>
        <label for="endDate" class="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Até</label>
        <input type="date" id="endDate" formControlName="endDate" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 p-2.5">
      </div>
      <div class="lg:col-span-1">
        <label for="sortBy" class="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Ordenar por</label>
        <select id="sortBy" formControlName="sortBy" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 p-2.5">
          <option value="data:desc">Mais Recentes</option>
          <option value="data:asc">Mais Antigas</option>
          <option value="valor:desc">Maior Resultado</option>
           <option value="valor:asc">Menor Resultado</option>
        </select>
      </div>
      <div>
        <button (click)="clearFilters()" type="button" class="w-full text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Limpar Filtros</button>
      </div>
    </form>
  </section>

  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
          <tr>
            <th class="px-6 py-3">Data</th>
            <th class="px-6 py-3">Descrição</th>
            <th class="px-6 py-3 text-right">Valor de Entrada</th>
            <th class="px-6 py-3 text-right">Valor de Saída</th>
            <th class="px-6 py-3 text-right">Resultado (R$)</th>
            <th class="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <ng-container *ngIf="allOperations$ | async as operations">
            <tr *ngIf="operations.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma operação encontrada para os filtros selecionados.</td>
            </tr>
            <tr *ngFor="let op of operations" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <td class="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{{ op.data | date:'dd/MM/yyyy':'UTC' }}</td>
              <td class="px-6 py-4 font-semibold text-slate-800 dark:text-white">{{ op.descricao }}</td>
              <td class="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{{ op.valorInvestido | currency:'BRL' }}</td>
              <td class="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{{ op.valorVenda | currency:'BRL' }}</td>
              <td class="px-6 py-4 text-right font-mono font-bold" [ngClass]="op.resultado >= 0 ? 'text-green-500' : 'text-red-500'">{{ op.resultado | currency:'BRL' }}</td>
              <td class="px-6 py-4 text-right">
                <button (click)="openPanel(op)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button (click)="deleteOperation(op.id!)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
    </div>

    <div class="p-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
      <span class="text-sm text-slate-500 dark:text-slate-400">
          Mostrando <span class="font-semibold">{{ (allOperations$ | async)?.length || 0 }}</span> de <span class="font-semibold">{{ totalOperations() }}</span> resultados
      </span>
      <div class="flex items-center gap-2">
          <button (click)="previousPage()" [disabled]="(currentPage$ | async) === 1" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Anterior</button>
          <span class="text-sm text-slate-500 dark:text-slate-400">
            Página <span class="font-semibold">{{ currentPage$ | async }}</span> de <span class="font-semibold">{{ totalPages() }}</span>
          </span>
          <button (click)="nextPage()" [disabled]="(currentPage$ | async) === totalPages()" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Próximo</button>
      </div>
    </div>
  </div>
</div>

<aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
      [class.translate-x-0]="isPanelOpen" [class.translate-x-full]="!isPanelOpen">
    <div class="flex flex-col h-full">
        <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ panelTitle }}</h3>
             <button (click)="closePanel()" class="text-slate-400 hover:text-slate-500 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <form [formGroup]="operationForm" (ngSubmit)="saveOperation()" class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            <div *ngIf="errorMessage()" class="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span class="font-medium">Erro:</span> {{ errorMessage() }}
            </div>

            <div>
                <label for="data" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Data da Operação</label>
                <input type="date" id="data" formControlName="data" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
                <label for="descricao" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                <input type="text" id="descricao" formControlName="descricao" placeholder="Ex: Trade PETR4" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
                <label for="valorInvestido" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Valor de Entrada (R$)</label>
                <input type="number" id="valorInvestido" formControlName="valorInvestido" placeholder="Ex: 10000.00" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
                <label for="valorVenda" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Valor de Saída (R$)</label>
                <input type="number" id="valorVenda" formControlName="valorVenda" placeholder="Ex: 11500.00" class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
            <label for="resultado" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Resultado (Lucro/Prejuízo R$)
            </label>
            <input
                type="number"
                id="resultado"
                formControlName="resultado"
                placeholder="Ex: 1500.00 ou -500.00"
                class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500">
        </div>
        </form>

        <div class="p-6 border-t border-slate-200 dark:border-slate-700">
            <button type="button" (click)="saveOperation()" [disabled]="operationForm.invalid" class="w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Salvar Operação
            </button>
        </div>
    </div>
</aside>
<div *ngIf="isPanelOpen" (click)="closePanel()" class="fixed inset-0 bg-black/60 z-40"></div>`,
})
 export class FundOperationsComponent implements OnInit, OnDestroy {
  private refresh$ = new BehaviorSubject<void>(undefined);
  private subscriptions = new Subscription();

  allOperations$: Observable<IFundOperation[]>;
  dashboardData$: Observable<IDashboardSummary | null>;

  isPanelOpen = false;
  panelTitle = '';
  operationForm: FormGroup;
  currentOperationId: string | null = null;

  errorMessage = signal<string | null>(null);

  filterForm: FormGroup;

  itemsPerPage = 10;
  currentPage$ = new BehaviorSubject<number>(1);
  totalOperations = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalOperations() / this.itemsPerPage) || 1);

constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private fundOperationsService: FundOperationsService,
    private performanceService: PerformanceService
  ) {
    // 1. INICIALIZE TODOS OS FORMULÁRIOS PRIMEIRO
    this.operationForm = this.fb.group({
      data: [this.formatDateForInput(new Date()), Validators.required],
      descricao: ['', [Validators.maxLength(100)]],
      valorInvestido: [null, [Validators.min(0)]],
      valorVenda: [null, [Validators.min(0)]],
      resultado: [null],
    });

    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      tipo: [''],
      sortBy: ['data:desc'],
    });

    // 2. AGORA, CONFIGURE OS OBSERVABLES QUE DEPENDEM DOS FORMULÁRIOS
    const filters$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value)
    );

    this.dashboardData$ = this.refresh$.pipe(
      startWith(null),
      switchMap(() => this.performanceService.getDashboardSummary("Desde o início").pipe(
        catchError(() => of(null))
      ))
    );

    // Reseta a página para 1 sempre que os filtros mudam
    this.subscriptions.add(
      filters$.subscribe(() => {
        if (this.currentPage$.value !== 1) {
          this.currentPage$.next(1);
        }
      })
    );

    this.allOperations$ = combineLatest([this.refresh$, filters$, this.currentPage$]).pipe(
      switchMap(([_, filters, page]) => {

        const sortValue = filters.sortBy || 'data:desc';
        const [sortBy, sortOrder] = sortValue.split(':');

        // --- INÍCIO DA CORREÇÃO DE LÓGICA DE DATAS ---
        let { startDate, endDate } = filters;

        // Se o usuário preencheu SÓ a data inicial, assuma que ele quer filtrar de lá ATÉ HOJE.
        if (startDate && !endDate) {
            endDate = this.formatDateForInput(new Date());
        }
        // Se o usuário preencheu SÓ a data final, não fazemos nada (filtra de [início] até [endDate])
        // Se ambos preenchidos, não fazemos nada.
        // Se nenhum preenchido, não fazemos nada.
        // --- FIM DA CORREÇÃO ---

        const apiFilters: FundOperationFilters = {
          startDate: startDate || undefined, // Usa o startDate
          endDate: endDate || undefined,     // Usa o endDate (potencialmente novo)
          tipo: filters.tipo || undefined,
          sortBy: sortBy as 'data' | 'valor',
          sortOrder: sortOrder as 'asc' | 'desc',
          page: page,
          limit: this.itemsPerPage,
        };

        return this.fundOperationsService.getFundOperations(apiFilters).pipe(
          tap(response => this.totalOperations.set(response.total)),
          map(response => response.data),
          // Conversor de Timestamp (mantido da correção anterior)
          map(operations => operations.map(op => {
            if (op.data && typeof (op.data as any).toDate === 'function') {
              op.data = (op.data as any).toDate();
            }
            return op;
          }))
        );
      }),
      shareReplay(1)
    );
  }
  ngOnInit(): void {
    // Limpa a mensagem de erro se o formulário mudar
    this.subscriptions.add(
        this.operationForm.valueChanges.subscribe(() => this.errorMessage.set(null))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  clearFilters(): void {
    this.filterForm.reset({
        startDate: null,
        endDate: null,
        tipo: '',
        sortBy: 'data:desc'
    });
  }

  openPanel(operation?: IFundOperation): void {
    this.errorMessage.set(null);
    if (operation) {
      this.panelTitle = 'Editar Operação';
      this.currentOperationId = operation.id!;
      this.operationForm.patchValue({
        data: this.formatDateForInput(operation.data),
        descricao: operation.descricao,
        valorInvestido: operation.valorInvestido,
        valorVenda: operation.valorVenda,
        resultado: operation.resultado,
      });
    } else {
      this.panelTitle = 'Registar Nova Operação';
      this.currentOperationId = null;
      this.operationForm.reset({
        data: this.formatDateForInput(new Date()),
        descricao: '',
        valorInvestido: null,
        valorVenda: null,
        resultado: null,
      });
    }
    this.isPanelOpen = true;
  }

  closePanel(): void { this.isPanelOpen = false; }

  saveOperation(): void {
    if (this.operationForm.invalid) {
      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.errorMessage.set(null);

    const formValue = this.operationForm.value;
    let saveObservable: Observable<any>;

    if (this.currentOperationId) {
      saveObservable = this.fundOperationsService.updateFundOperation(this.currentOperationId, formValue);
    } else {
      saveObservable = this.fundOperationsService.createFundOperation(formValue);
    }

    saveObservable.subscribe({
      next: () => {
        this.refresh$.next(); // Dispara a atualização dos KPIs e da tabela
        this.closePanel();
      },
      error: (err: HttpErrorResponse) => {
        const serverMessage = err.error?.message || 'Ocorreu um erro desconhecido ao salvar.';
        this.errorMessage.set(Array.isArray(serverMessage) ? serverMessage[0] : serverMessage);
      }
    });
  }

  deleteOperation(id: string): void {
    // (Poderia usar um modal mais bonito no futuro)
    if (confirm('Tem certeza que deseja apagar esta operação?')) {
      this.fundOperationsService.deleteFundOperation(id).subscribe(() => {
        this.refresh$.next(); // Dispara a atualização dos KPIs e da tabela
      });
    }
  }

  nextPage(): void {
    if (this.currentPage$.value < this.totalPages()) {
      this.currentPage$.next(this.currentPage$.value + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage$.value > 1) {
      this.currentPage$.next(this.currentPage$.value - 1);
    }
  }

  private formatDateForInput(date: Date | string): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
}
