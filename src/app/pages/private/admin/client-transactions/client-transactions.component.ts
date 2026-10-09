import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith, Observable, switchMap, tap, shareReplay, forkJoin, of } from 'rxjs';
import { ClientTransactionsService, IClientTransaction } from '../../../../services/client-transactions.service';
import { ClientsService, IUser } from '../../../../services/clients.service';

@Component({
  selector: 'app-client-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Cabeçalho da Página -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">
            Aportes e Resgates
          </h1>
          <p class="text-slate-500 dark:text-slate-400">
            Registe e aprove as transações de seus clientes.
          </p>
        </div>
        <button
          (click)="openPanel()"
          class="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Registar Transação</span>
        </button>
      </div>

      <!-- Layout Principal: Histórico e Solicitações lado a lado -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Coluna de Histórico de Transações -->
        <div class="lg:col-span-2 space-y-4">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white">
            Histórico de Transações
          </h2>

          <!-- Barra de Filtros -->
          <form
            [formGroup]="filterForm"
            class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
          >
            <div>
              <label
                for="startDate"
                class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >Data Inicial</label
              >
              <input
                type="date"
                id="startDate"
                formControlName="startDate"
                class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600
                 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
              />
            </div>
            <div>
              <label
                for="endDate"
                class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >Data Final</label
              >
              <input
                type="date"
                id="endDate"
                formControlName="endDate"
                class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600
                 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
              />
            </div>
            <div class="md:col-span-2 md:self-end flex justify-end">
              <button
                (click)="clearFilters()"
                type="button"
                class="text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300
                 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300
                 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Limpar Filtros
              </button>
            </div>
          </form>
          <div
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead
                  class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase"
                >
                  <tr>
                    <th class="px-6 py-3">Cliente</th>
                    <th class="px-6 py-3">Data</th>
                    <th class="px-6 py-3">Tipo</th>
                    <th class="px-6 py-3 text-right">Valor (R$)</th>
                    <th class="px-6 py-3 text-center">Status</th>
                    <th class="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                  <ng-container
                    *ngIf="paginatedTransactions$ | async as transactions"
                  >
                    <tr *ngIf="transactions.length === 0">
                      <td
                        colspan="6"
                        class="text-center py-8 text-slate-500 dark:text-slate-400"
                      >
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                    <tr *ngFor="let op of transactions">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img
                            [src]="
                              'https://placehold.co/40x40/cccccc/333333?text=' +
                              getInitials(op.clientName)
                            "
                            class="w-8 h-8 rounded-full"
                            alt="Avatar"
                          />
                          <div>
                            <p
                              class="font-semibold text-slate-800 dark:text-white"
                            >
                              {{ op.clientName }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 font-medium text-slate-600 dark:text-slate-300"
                      >
                        {{ op.data | date : 'dd/MM/yyyy' : 'UTC' }}
                      </td>
                      <td
                        class="px-6 py-4"
                        [ngClass]="
                          op.tipo === 'Aporte'
                            ? 'text-green-500'
                            : 'text-red-500'
                        "
                      >
                        {{ op.tipo }}
                      </td>
                      <td
                        class="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400"
                      >
                        {{ op.valor | currency : 'BRL' }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span
                          class="px-2 py-1 text-xs font-semibold rounded-full"
                          [ngClass]="{
                            'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300':
                              op.status === 'Aprovado',
                            'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300':
                              op.status === 'Negado'
                          }"
                        >
                          {{ op.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex justify-end items-center gap-2">
                          <button
                            (click)="openPanel(op)"
                            class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                              />
                            </svg>
                          </button>

                          <button
                            (click)="deleteTransaction(op)"
                            class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30 rounded-md transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
            <!-- Paginação -->
            <div
              class="p-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800"
            >
              <span class="text-sm text-slate-500 dark:text-slate-400"
                >Página
                <span class="font-semibold">{{ currentPage$ | async }}</span> de
                <span class="font-semibold">{{ totalPages }}</span></span
              >
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="(currentPage$ | async) === 1"
                  class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  (click)="nextPage()"
                  [disabled]="(currentPage$ | async) === totalPages"
                  class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna de Solicitações Pendentes -->
        <div class="lg:col-span-1 space-y-4">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white">
            Solicitações Pendentes
          </h2>
          <div
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 max-h-[45rem] overflow-y-auto"
          >
            <ng-container *ngIf="pendingRequests$ | async as requests">
              <div
                *ngIf="requests.length === 0"
                class="text-center py-8 text-slate-500 dark:text-slate-400"
              >
                Nenhuma solicitação pendente.
              </div>
              <ul *ngIf="requests.length > 0" class="space-y-3">
                <li
                  *ngFor="let req of requests"
                  class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="font-semibold text-slate-800 dark:text-white text-sm"
                      >{{ req.clientName }}</span
                    >
                    <span
                      class="px-2 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="
                        req.tipo === 'Aporte'
                          ? 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                          : 'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300'
                      "
                    >
                      {{ req.tipo }}
                    </span>
                  </div>
                  <p
                    class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1"
                  >
                    {{ req.valor | currency : 'BRL' }}
                  </p>
                  <div class="flex items-center gap-2 mt-3">
                    <button
                      (click)="processRequest(req, 'Aprovado')"
                      class="w-full text-xs font-medium text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30 rounded-md py-1.5 transition-colors"
                    >
                      Aprovar
                    </button>
                    <button
                      (click)="processRequest(req, 'Negado')"
                      class="w-full text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-md py-1.5 transition-colors"
                    >
                      Negar
                    </button>
                  </div>
                </li>
              </ul>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Painel Lateral -->
      <aside
        class="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="isPanelOpen"
        [class.translate-x-full]="!isPanelOpen"
      >
        <div class="flex flex-col h-full">
          <div
            class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700"
          >
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">
              {{ panelTitle }}
            </h3>
            <button
              (click)="closePanel()"
              class="text-slate-400 hover:text-slate-500 p-1 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <form
            [formGroup]="transactionForm"
            (ngSubmit)="saveTransaction()"
            class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800"
          >
            <div>
              <label
                for="clientId"
                class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >Cliente</label
              >
              <select
                id="clientId"
                formControlName="clientId"
                class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
              >
                <option value="" disabled>Selecione um cliente</option>
                <option
                  *ngFor="let client of allClients$ | async"
                  [value]="client.id"
                >
                  {{ client.name }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  for="data"
                  class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Data</label
                >
                <input
                  type="date"
                  id="data"
                  formControlName="data"
                  class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
                  required
                />
              </div>
              <div>
                <label
                  for="tipo"
                  class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Tipo de Transação</label
                >
                <select
                  id="tipo"
                  formControlName="tipo"
                  class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
                >
                  <option>Aporte</option>
                  <option>Resgate</option>
                </select>
              </div>
            </div>
            <div>
              <label
                for="valor"
                class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >Valor (R$)</label
              >
              <input
                type="number"
                id="valor"
                formControlName="valor"
                class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5"
                required
              />
            </div>
          </form>
          <div class="p-6 border-t border-slate-200 dark:border-slate-700">
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                (click)="closePanel()"
                class="text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="saveTransaction()"
                [disabled]="transactionForm.invalid"
                class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar Transação
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class ClientTransactionsComponent implements OnInit {
  private refresh$ = new BehaviorSubject<void>(undefined);
  private allTransactions$: Observable<IClientTransaction[]>;

  paginatedTransactions$: Observable<IClientTransaction[]>;
  pendingRequests$: Observable<IClientTransaction[]>;
  allClients$: Observable<IUser[]>;
  currentPage$ = new BehaviorSubject<number>(1);
  totalPages = 1;
  filterForm: FormGroup;

  isPanelOpen = false;
  panelTitle = '';
  transactionForm: FormGroup;
  currentTransactionId: string | null = null;
  itemsPerPage = 5;
  currentTransaction: IClientTransaction | undefined;

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private clientTransactionsService: ClientTransactionsService,
    private clientsService: ClientsService
  ) {
    this.transactionForm = this.fb.group({
      clientId: ['', Validators.required],
      data: [
        this.formatDateForInput(new Date().toISOString()),
        Validators.required,
      ],
      tipo: ['Aporte' as 'Aporte' | 'Resgate', Validators.required],
      valor: [null, [Validators.required, Validators.min(0.01)]],
    });

    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
    });

    this.allClients$ = this.clientsService.getClients().pipe(shareReplay(1));

    const filters$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value)
    );

    this.allTransactions$ = combineLatest([this.refresh$, filters$]).pipe(
      // o 'combineLatest' emite sempre que o refresh$ OU os filters$ mudarem
      switchMap(([_, filters]) => {
        // Prepara os filtros para a API (remove valores nulos)
        const apiFilters = {
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
        };
        // Chama o serviço com os filtros
        return this.clientTransactionsService.getClientTransactions(apiFilters);
      }),
      map((transactions: any[]) =>
        transactions
          .filter((t) => t.tipo !== 'Rendimento')
          .map((transaction) => {
            // Converte as datas do Firestore (essa lógica pode ser movida para o serviço)
            if (
              transaction.data &&
              typeof transaction.data === 'object' &&
              transaction.data._seconds
            ) {
              return {
                ...transaction,
                data: new Date(transaction.data._seconds * 1000).toISOString(),
              };
            }
            return transaction;
          })
      ),
      shareReplay(1)
    );

    const historicTransactions$ = this.allTransactions$.pipe(
      map((ops) =>
        ops
          .filter((op) => op.status !== 'Pendente')
          .sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          )
      )
    );

    this.pendingRequests$ = this.allTransactions$.pipe(
      map((ops) =>
        ops
          .filter((op) => op.status === 'Pendente')
          .sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          )
      )
    );

    this.paginatedTransactions$ = combineLatest([
      historicTransactions$,
      this.currentPage$,
    ]).pipe(
      map(([ops, page]) => {
        this.updatePagination(ops.length);
        const startIndex = (page - 1) * this.itemsPerPage;
        return ops.slice(startIndex, this.itemsPerPage * page);
      })
    );
  }

  ngOnInit(): void {}

  clearFilters(): void {
    this.filterForm.reset({ startDate: null, endDate: null });
  }

  private updatePagination(totalItems: number): void {
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
    if (this.currentPage$.value > this.totalPages) {
      this.currentPage$.next(this.totalPages);
    }
  }

  nextPage(): void {
    if (this.currentPage$.value < this.totalPages)
      this.currentPage$.next(this.currentPage$.value + 1);
  }
  previousPage(): void {
    if (this.currentPage$.value > 1)
      this.currentPage$.next(this.currentPage$.value - 1);
  }

  openPanel(transaction?: IClientTransaction): void {
    if (transaction) {
      this.panelTitle = 'Editar Transação';
      this.currentTransactionId = transaction.id;
      this.currentTransaction = transaction;
      this.transactionForm.setValue({
        data: this.formatDateForInput(transaction.data),
        clientId: transaction.clientId,
        tipo: transaction.tipo,
        valor: transaction.valor,
      });
    } else {
      this.panelTitle = 'Registar Nova Transação';
      this.currentTransactionId = null;
      this.transactionForm.reset({
        data: this.formatDateForInput(new Date().toISOString()),
        tipo: 'Aporte',
        clientId: '',
      });
    }
    this.isPanelOpen = true;
  }

  closePanel(): void {
    this.isPanelOpen = false;
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) return;
    const formValue = this.transactionForm.value;

    // A API só aceita os campos do DTO (data, clientId, tipo, valor).
    // O status é definido pelo endpoint: POST entra como Aprovado.
    const saveObservable = this.currentTransactionId
      ? this.clientTransactionsService.updateClientTransaction(
          this.currentTransactionId,
          formValue
        )
      : this.clientTransactionsService.createClientTransaction(formValue);
    saveObservable.subscribe(() => this.refresh$.next());
    this.closePanel();
  }

  /**
   * Aprovar ou negar só muda o status. O saldo do cliente é recalculado
   * pela API dentro da mesma transação do Firestore.
   */
  processRequest(
    transaction: IClientTransaction,
    status: 'Aprovado' | 'Negado'
  ): void {
    this.clientTransactionsService
      .updateClientTransaction(transaction.id, { status })
      .subscribe({
        next: () => this.refresh$.next(),
        error: (err) => console.error('Erro ao processar a transação', err),
      });
  }
  deleteTransaction(transaction: IClientTransaction): void {
    if (!transaction || !transaction.id) {
      console.error('Tentativa de exclusão sem um ID de transação válido.');
      return;
    }

    // 1. Confirmação do usuário
    const confirmation = window.confirm(
      `Tem certeza de que deseja excluir esta transação?

Cliente: ${transaction.clientName}
Tipo: ${transaction.tipo}
Valor: ${transaction.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}
Data: ${this.datePipe.transform(transaction.data, 'dd/MM/yyyy')}

Atenção: Se esta transação já estiver "Aprovada", excluí-la
pode fazer com que o histórico de rendimentos seja reprocessado.`
    );

    if (confirmation) {
      // 2. Chama o serviço de exclusão
      this.clientTransactionsService
        .deleteClientTransaction(transaction.id)
        .subscribe({
          next: () => {
            this.refresh$.next(); // 3. Atualiza a lista
            this.closePanel(); // 4. Fecha o painel (caso a exclusão tenha vindo de lá)
          },
          error: (err) => {
            console.error('Erro ao excluir a transação', err);
            // (Opcional) Adicionar um toastr/snackbar de erro aqui
          },
        });
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private formatDateForInput(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'yyyy-MM-dd') || '';
  }
}
