import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, map, switchMap, filter, startWith, shareReplay } from 'rxjs';
import { IClientTransaction, ClientTransactionsService } from '../../../../services/client-transactions.service';
import { AuthService } from '../../../../services/auth.service';
import { IUser } from '../../../../services/clients.service';

// Define a specific type for the period filters for better type safety.
type PeriodFilter = '6 meses' | 'Mês' | 'Desde o início';

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  providers: [DatePipe],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Cabeçalho da Página com Filtros -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Extrato Financeiro</h1>
          <p class="text-slate-500 dark:text-slate-400">Histórico de todas as suas movimentações financeiras.</p>
        </div>
        <!-- Filtros -->
        <div class="flex items-center gap-2" [formGroup]="filterForm">
          <select formControlName="type" class="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500">
            <option value="Todos">Todas as Transações</option>
            <option value="Aporte">Aportes</option>
            <option value="Resgate">Resgates</option>
          </select>
          <div class="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
              <button *ngFor="let f of periodFilters" (click)="setPeriodFilter(f)"
                [ngClass]="periodFilter$.value === f ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'"
                class="px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200">
                {{ f }}
              </button>
          </div>
        </div>
      </div>

      <!-- Tabela de Extrato Financeiro -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th class="px-6 py-3">Data</th>
                <th class="px-6 py-3">Descrição</th>
                <th class="px-6 py-3 text-right">Valor (R$)</th>
                <th class="px-6 py-3 text-right">Saldo (R$)</th>
              </tr>
            </thead>
            <tbody>
          <ng-container *ngIf="(paginatedTransactions$ | async) as transactions">
      <tr *ngFor="let op of transactions" class="border-b border-slate-200 dark:border-slate-800">
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ op.data |date:'dd/MM/yyyy':'UTC' }}</td>
        <td class="px-6 py-4">{{ op.tipo }} em Carteira</td>

        <td class="px-6 py-4 text-right font-mono"
            [ngClass]="(op.tipo === 'Resgate' || (op.tipo === 'Rendimento' && op.valor < 0)) ? 'text-red-500' : 'text-green-500'">

            {{ (op.tipo === 'Resgate' || (op.tipo === 'Rendimento' && op.valor < 0)) ? '-' : '+' }}
            {{ abs(op.valor) | currency:'BRL' }}
        </td>
        <td class="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{{ op.saldo | currency:'BRL' }}</td>
      </tr>
    </ng-container>
            </tbody>
          </table>
        </div>
        <!-- Paginação -->
        <div class="p-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <span class="text-sm text-slate-500 dark:text-slate-400">Página <span class="font-semibold">{{ currentPage$.value }}</span> de <span class="font-semibold">{{ totalPages }}</span></span>
          <div class="flex items-center gap-2">
            <button (click)="previousPage()" [disabled]="currentPage$.value === 1" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Anterior</button>
            <button (click)="nextPage()" [disabled]="currentPage$.value === totalPages" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StatementComponent implements OnInit {
  filterForm: FormGroup;
  periodFilters: PeriodFilter[] = [ 'Mês', 'Desde o início'];
  periodFilter$ = new BehaviorSubject<PeriodFilter>('Desde o início');

  paginatedTransactions$: Observable<IClientTransaction[]>;
  currentPage$ = new BehaviorSubject<number>(1);
  totalPages = 1;
  itemsPerPage = 10;


constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private transactionsService: ClientTransactionsService
) {
    this.filterForm = this.fb.group({
        type: new FormControl('Todos'),
    });

    const typeFilter$ = this.filterForm.get('type')!.valueChanges.pipe(startWith('Todos'));
    const periodFilter$ = this.periodFilter$.asObservable();

    // MODIFICADO: A busca de dados agora é um único fluxo limpo
    const allTransactions$ = combineLatest([
      this.authService.currentUser$.pipe(filter((user): user is IUser => !!user)),
      periodFilter$,
    ]).pipe(
      switchMap(([user, period]) => {
        // Calcula as datas de início e fim
        const endDate = new Date();
        let startDate: Date | null = new Date();
        if (period === 'Mês') startDate.setMonth(endDate.getMonth() - 1);
        else if (period === '6 meses') startDate.setMonth(endDate.getMonth() - 6);
        else startDate = null; // "Desde o início"

        // Monta os filtros para a API, incluindo o ID do usuário logado
        const apiFilters = {
          clientId: user.id,
          startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        };

        // Chama o serviço com os filtros corretos
        return this.transactionsService.getClientTransactions(apiFilters);
      }),
      // O backend já filtra e ordena, então o frontend só precisa processar
    map(transactions =>
        // Removemos o filtro '&& t.tipo !== "Rendimento"'
        transactions.filter(t => t.status === 'Aprovado')
      ),
      shareReplay(1) // Evita múltiplas chamadas à API
    );

    const filteredTransactions$ = combineLatest([allTransactions$, typeFilter$, this.authService.currentUser$]).pipe(
        map(([transactions, type, user]) => {
            if (!user) return [];

            const typeFiltered = type === 'Todos'
                ? transactions
                : transactions.filter(t => t.tipo === type);

            // Lógica de cálculo de saldo


             // Lógica de cálculo de saldo (simplificada)
            let currentBalance = user.totalInvestido || 0;
            return [...typeFiltered].reverse().map(t => { // Itera do mais novo para o mais antigo
                const balanceAfterTransaction = currentBalance;

                let movementValue = 0;
                if (t.tipo === 'Aporte') {
                    movementValue = t.valor;
                } else if (t.tipo === 'Resgate') {
                    movementValue = -t.valor;
                } else if (t.tipo === 'Rendimento') {
                    // Trata Rendimento como um valor positivo
                    movementValue = t.valor;
                }

                // Calcula o saldo *antes* desta transação
                currentBalance = currentBalance - movementValue;

                // Retorna o saldo *após* a transação
                return { ...t, saldo: balanceAfterTransaction };
            }).reverse();
        })
    );

    this.paginatedTransactions$ = combineLatest([filteredTransactions$, this.currentPage$]).pipe(
      map(([transactions, currentPage]) => {
        const startIdx = (currentPage - 1) * this.itemsPerPage;
        const endIdx = startIdx + this.itemsPerPage;
        this.totalPages = Math.max(1, Math.ceil(transactions.length / this.itemsPerPage));
        return transactions.slice(startIdx, endIdx);
      })
    );
}
public abs(value: number): number {
    return Math.abs(value);
  }

  ngOnInit(): void {}

  setPeriodFilter(period: PeriodFilter): void {
    this.periodFilter$.next(period);
    this.currentPage$.next(1);
  }

  nextPage(): void {
    if (this.currentPage$.value < this.totalPages) {
      this.currentPage$.next(this.currentPage$.value + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage$.value > 1) {
      this.currentPage$.next(this.currentPage$.value - 1);
    }
  }
}
