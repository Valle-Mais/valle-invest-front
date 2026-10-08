import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';

// Interface para a nova estrutura de Operação
export interface Operacao {
  id: number;
  titulo: string;
  tipo: 'Compra' | 'Venda';
  descricao: string;
}

// Mock Data com a nova estrutura
const mockOperations: Operacao[] = [
  { id: 1, titulo: 'Setup inicial de servidor', tipo: 'Compra', descricao: 'Aquisição de nova instância na AWS para o projeto X.' },
  { id: 2, titulo: 'Venda de licenças de software', tipo: 'Venda', descricao: 'Venda de 10 licenças do sistema de gestão para o cliente Y.' },
  { id: 3, titulo: 'Contratação de serviço de design', tipo: 'Compra', descricao: 'Contratação de freelancer para criação da nova identidade visual.' },
  { id: 4, titulo: 'Renovação de Domínio valleconsultoria.com', tipo: 'Compra', descricao: 'Pagamento da anuidade do domínio principal da empresa.'},
  { id: 5, titulo: 'Consultoria SEO para Cliente Z', tipo: 'Venda', descricao: 'Serviço de otimização de busca para o site do Cliente Z.'},
];

@Component({
  selector: 'app-admin-operacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Cabeçalho da Página -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Operações</h1>
          <p class="text-slate-500 dark:text-slate-400">Adicione, edite ou remova as operações da empresa.</p>
        </div>
        <button (click)="abrirPainel()" class="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Adicionar Operação</span>
        </button>
      </div>

      <!-- Tabela de Operações -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th class="px-6 py-3">Título</th>
                <th class="px-6 py-3">Tipo</th>
                <th class="px-6 py-3 hidden md:table-cell">Descrição</th>
                <th class="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr *ngIf="(operacoes$ | async)?.length === 0">
                <td colspan="4" class="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma operação cadastrada.</td>
              </tr>
              <tr *ngFor="let op of (operacoes$ | async)">
                <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">{{ op.titulo }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full"
                    [ngClass]="op.tipo === 'Compra' ? 'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300' : 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300'">
                    {{ op.tipo }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-sm truncate">{{ op.descricao }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-end items-center gap-2">
                    <button (click)="abrirPainel(op)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                    <button (click)="deletarOperacao(op.id)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Overlay do Painel Lateral -->
      <div *ngIf="isSidePanelOpen" (click)="fecharPainel()" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"></div>

      <!-- Painel Lateral para Adicionar/Editar -->
      <aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
             [class.translate-x-0]="isSidePanelOpen"
             [class.translate-x-full]="!isSidePanelOpen">
        <div class="flex flex-col h-full">
          <!-- Header do Painel -->
          <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ panelTitle }}</h3>
            <button (click)="fecharPainel()" class="text-slate-400 hover:text-slate-500 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <!-- Formulário -->
          <form [formGroup]="operacaoForm" (ngSubmit)="salvarOperacao()" class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            <div>
              <label for="titulo" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
              <input type="text" id="titulo" formControlName="titulo" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block w-full p-2.5" required>
            </div>
            <div>
              <label for="tipo" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Operação</label>
              <select id="tipo" formControlName="tipo" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block w-full p-2.5">
                <option>Compra</option>
                <option>Venda</option>
              </select>
            </div>
            <div>
              <label for="descricao" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
              <textarea id="descricao" formControlName="descricao" rows="6" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block w-full p-2.5"></textarea>
            </div>
          </form>
          <!-- Footer do Painel -->
          <div class="p-6 border-t border-slate-200 dark:border-slate-700">
            <div class="flex justify-end space-x-4">
              <button type="button" (click)="fecharPainel()" class="text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancelar</button>
              <button type="button" (click)="salvarOperacao()" [disabled]="operacaoForm.invalid" class="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed">Salvar Operação</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class AdminOperacoesComponent implements OnInit {
  operacoes$ = new BehaviorSubject<Operacao[]>([]);

  isSidePanelOpen = false;
  panelTitle = '';
  operacaoForm: FormGroup;
  currentOperacaoId: number | null = null;

  constructor(private fb: FormBuilder) {
    this.operacaoForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['Compra' as 'Compra' | 'Venda', Validators.required],
      descricao: [''],
    });
  }

  ngOnInit(): void {
    this.operacoes$.next([...mockOperations]);
  }

  abrirPainel(operacao?: Operacao): void {
    if (operacao) {
      this.panelTitle = 'Editar Operação';
      this.currentOperacaoId = operacao.id;
      this.operacaoForm.setValue({
        titulo: operacao.titulo,
        tipo: operacao.tipo,
        descricao: operacao.descricao
      });
    } else {
      this.panelTitle = 'Adicionar Nova Operação';
      this.currentOperacaoId = null;
      this.operacaoForm.reset({
        titulo: '',
        tipo: 'Compra',
        descricao: ''
      });
    }
    this.isSidePanelOpen = true;
  }

  fecharPainel(): void {
    this.isSidePanelOpen = false;
  }

  salvarOperacao(): void {
    if (this.operacaoForm.invalid) return;

    const currentOps = this.operacoes$.getValue();
    const formValue = this.operacaoForm.value;

    if (this.currentOperacaoId) {
      // Atualizar
      const updatedOps = currentOps.map(op =>
        op.id === this.currentOperacaoId ? { ...op, ...formValue } : op
      );
      this.operacoes$.next(updatedOps);
    } else {
      // Criar
      const newId = currentOps.length > 0 ? Math.max(...currentOps.map(op => op.id)) + 1 : 1;
      const novaOperacao: Operacao = { id: newId, ...formValue };
      this.operacoes$.next([novaOperacao, ...currentOps]);
    }

    this.fecharPainel();
  }

  deletarOperacao(id: number): void {
    // Adicionar um modal de confirmação aqui seria uma boa prática
    const currentOps = this.operacoes$.getValue();
    this.operacoes$.next(currentOps.filter(op => op.id !== id));
  }
}
