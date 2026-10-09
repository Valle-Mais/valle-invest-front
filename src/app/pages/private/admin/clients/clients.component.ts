// Arquivo: src/app/pages/private/admin/clients/clients.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith, Observable, switchMap } from 'rxjs';
import { IUser, ClientsService } from '../../../../services/clients.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Cabeçalho da Página -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Usuários</h1>
          <p class="text-slate-500 dark:text-slate-400">Adicione, remova e gira o acesso dos seus usuários.</p>
        </div>
        <button (click)="openPanel()" class="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Adicionar Usuário</span>
        </button>
      </div>

      <!-- Métricas -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Saldo Total de Clientes</h3>
            <p class="text-3xl font-bold text-emerald-500 mt-1">{{ metrics.totalInvestido | currency:'BRL' }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h3 class="text-slate-500 dark:text-slate-400 text-sm font-semibold">Clientes Ativos</h3>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{{ metrics.clientesAtivos }}</p>
          </div>
      </section>

      @if (feedback(); as msg) {
        <div class="p-3 text-sm rounded-lg"
             [ngClass]="msg.ok ? 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'">
          {{ msg.text }}
        </div>
      }

      <!-- Tabela de Clientes -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th class="px-6 py-3">Nome</th>
                <th class="px-6 py-3">Data de Inscrição</th>
                <th class="px-6 py-3 text-right">Saldo (R$)</th>
                <th class="px-6 py-3 text-center">Porcentagem Total</th>
                <th class="px-6 py-3 text-center">Status</th>
                <th class="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <ng-container *ngIf="(paginatedUsers$ | async) as users">
                <tr *ngIf="users.length === 0">
                  <td colspan="5" class="text-center py-8 text-slate-500 dark:text-slate-400">Nenhum usuário encontrado.</td>
                </tr>
                <tr *ngFor="let user of users">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="'https://placehold.co/40x40/cccccc/333333?text=' + getInitials(user.name)" class="w-8 h-8 rounded-full" alt="Avatar">
                      <div>
                        <p class="font-semibold text-slate-800 dark:text-white">{{ user.name }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ user.email }}</p>
                         <span class="mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full"
                           [ngClass]="{
                             'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300': user.role === 'admin',
                             'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300': user.role === 'client'
                           }">
                          {{ user.role === 'admin' ? 'Admin' : 'Cliente' }}
                        </span>
                        @if (user.mustSetPassword) {
                          <span class="mt-1 ml-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" title="Ainda não definiu senha">
                            Convite pendente
                          </span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-500 dark:text-slate-400">{{ user.joinDate | date: 'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{{ user.totalInvestido | currency:'BRL' }}</td>
                  <td class="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{{ user?.participationPercent | number:'1.2-2' }}%</td>
                  <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full" [ngClass]="{
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': user.status === 'Ativo',
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': user.status === 'Inativo'
                        }">
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end items-center gap-2">
                      <button (click)="resendInvite(user)" [disabled]="invitingId() === user.id" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50" title="Reenviar convite para definir senha">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </button>
                      <button (click)="openPanel(user)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Editar Usuário">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                      </button>
                      <button (click)="toggleStatus(user)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" [title]="user.status === 'Ativo' ? 'Desativar' : 'Ativar'">
                        <svg *ngIf="user.status === 'Ativo'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        <svg *ngIf="user.status === 'Inativo'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
        <!-- Paginação -->
        <div class="p-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <span class="text-sm text-slate-500 dark:text-slate-400">Página <span class="font-semibold">{{ currentPage$ | async }}</span> de <span class="font-semibold">{{ totalPages }}</span></span>
          <div class="flex items-center gap-2">
            <button (click)="previousPage()" [disabled]="(currentPage$ | async) === 1" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Anterior</button>
            <button (click)="nextPage()" [disabled]="(currentPage$ | async) === totalPages" class="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-50">Próximo</button>
          </div>
        </div>
      </div>

      <!-- Painel Lateral -->
      <aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
             [class.translate-x-0]="isPanelOpen"
             [class.translate-x-full]="!isPanelOpen">
        <div class="flex flex-col h-full">
          <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ panelTitle }}</h3>
            <button (click)="closePanel()" class="text-slate-400 hover:text-slate-500 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            <div>
              <label for="name" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
              <input type="text" id="name" formControlName="name" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" required>
            </div>
            <div>
              <label for="email" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" id="email" formControlName="email" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" required>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="role" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                <select id="role" formControlName="role" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5">
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label for="totalInvestido" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Saldo (R$)</label>
                <input type="number" id="totalInvestido" formControlName="totalInvestido" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5">
              </div>
            </div>
          </form>
          <div class="p-6 border-t border-slate-200 dark:border-slate-700">
            <div class="flex justify-end space-x-4">
              <button type="button" (click)="closePanel()" class="text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancelar</button>
              <button type="button" (click)="saveUser()" [disabled]="userForm.invalid" class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class ClientsComponent implements OnInit {
  private refresh$ = new BehaviorSubject<void>(undefined);
  private readonly auth = inject(AuthService);

  /** Mensagem de resultado das ações da tela (reenvio de convite). */
  readonly feedback = signal<{ ok: boolean; text: string } | null>(null);
  readonly invitingId = signal<string | null>(null);

  resendInvite(user: IUser): void {
    this.invitingId.set(user.id);
    this.feedback.set(null);
    this.auth.resendInvite(user.id).subscribe({
      next: () => {
        this.invitingId.set(null);
        this.feedback.set({ ok: true, text: `Convite reenviado para ${user.email}.` });
        this.refresh$.next();
      },
      error: (err) => {
        this.invitingId.set(null);
        this.feedback.set({ ok: false, text: err.error?.message || 'Não foi possível reenviar o convite.' });
      },
    });
  }

  // Observables para a UI
  allUsers$: Observable<IUser[]>;
  paginatedUsers$: Observable<IUser[]>;
  currentPage$ = new BehaviorSubject<number>(1);
  totalPages = 1;

  // Estado do componente
  isPanelOpen = false;
  panelTitle = '';
  userForm: FormGroup;
  currentUserId: string | null = null;
  itemsPerPage = 5;

  // Métricas
  metrics = {
    totalInvestido: 0,
    clientesAtivos: 0,
  };

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientsService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['client' as 'admin' | 'client', Validators.required],
      totalInvestido: [0, [Validators.required, Validators.min(0)]]
    });

    // Busca todos os usuários quando o componente é inicializado ou quando o refresh$ é acionado
    this.allUsers$ = this.refresh$.pipe(
      switchMap(() => this.clientsService.getClients())
    );

    // Paginação para os usuários
    this.paginatedUsers$ = combineLatest([this.allUsers$, this.currentPage$]).pipe(
      map(([users, page]) => {
        this.updatePagination(users.length);
        this.calculateMetrics(users.filter(u => u.role === 'client'));
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return users.slice(startIndex, endIndex);
      })
    );
  }

  ngOnInit(): void {
    this.refresh$.next(); // Carrega os dados iniciais
  }

  private calculateMetrics(clients: IUser[]): void {
      this.metrics.totalInvestido = clients.reduce((acc, user) => acc + user.totalInvestido, 0);
      this.metrics.clientesAtivos = clients.filter(user => user.status === 'Ativo').length;
  }

  private updatePagination(totalItems: number): void {
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
    if(this.currentPage$.value > this.totalPages) {
      this.currentPage$.next(this.totalPages);
    }
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

  openPanel(user?: IUser): void {
    if (user) {
      this.panelTitle = 'Editar Usuário';
      this.currentUserId = user.id!;
      this.userForm.setValue({
        name: user.name,
        email: user.email,
        role: user.role,
        totalInvestido: user.totalInvestido
      });
      // Na edição só o nome pode mudar. Email é a identidade de login,
      // role não muda por aqui e totalInvestido é derivado das transações.
      this.userForm.get('email')!.disable();
      this.userForm.get('role')!.disable();
      this.userForm.get('totalInvestido')!.disable();
    } else {
      this.panelTitle = 'Adicionar Novo Usuário';
      this.currentUserId = null;
      this.userForm.reset({
        name: '',
        email: '',
        role: 'client',
        totalInvestido: 0
      });
      this.userForm.get('email')!.enable();
      this.userForm.get('role')!.enable();
      this.userForm.get('totalInvestido')!.enable();
    }
    this.isPanelOpen = true;
  }

  closePanel(): void {
    this.isPanelOpen = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    // .value ignora controles desabilitados: na edição vira só { name },
    // que é o que o UpdateClientDto da API aceita.
    const formValue = this.userForm.value;

    const saveObservable = this.currentUserId
      ? this.clientsService.updateClient(this.currentUserId, { name: formValue.name })
      : this.clientsService.createClient(formValue);

    saveObservable.subscribe(() => {
      this.refresh$.next();
      this.closePanel();
    });
  }

  toggleStatus(user: IUser): void {
    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
    this.clientsService.updateClient(user.id, { status: newStatus }).subscribe(() => {
      this.refresh$.next();
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
