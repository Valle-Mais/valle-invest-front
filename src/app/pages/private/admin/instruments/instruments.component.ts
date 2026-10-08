import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { IInstrument, InstrumentsService } from '../../../../services/instruments.service';

@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Cabeçalho da Página -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Instrumentos</h1>
          <p class="text-slate-500 dark:text-slate-400">Adicione, edite ou remova os instrumentos negociáveis.</p>
        </div>
        <button (click)="openPanel()" class="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Adicionar Instrumento</span>
        </button>
      </div>

      <!-- Tabela de Instrumentos -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th class="px-6 py-3">Nome / Ticker</th>
                <th class="px-6 py-3">Tipo</th>
                <th class="px-6 py-3">Descrição</th>
                <th class="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <ng-container *ngIf="(instruments$ | async) as instruments">
                <tr *ngIf="instruments.length === 0">
                  <td colspan="4" class="text-center py-8 text-slate-500 dark:text-slate-400">Nenhum instrumento registado.</td>
                </tr>
                <tr *ngFor="let item of instruments">
                  <td class="px-6 py-4 font-semibold text-slate-800 dark:text-white">{{ item.name }}</td>
                  <td class="px-6 py-4 text-slate-500 dark:text-slate-400">{{ item.type }}</td>
                  <td class="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{{ item.description }}</td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end items-center gap-2">
                      <button (click)="openPanel(item)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Editar Instrumento">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                      </button>
                      <button (click)="deleteInstrument(item.id!)" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Apagar Instrumento">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
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
          <form [formGroup]="instrumentForm" (ngSubmit)="saveInstrument()" class="flex-grow p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            <div>
              <label for="name" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Nome / Ticker</label>
              <input type="text" id="name" formControlName="name" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" placeholder="Ex: PETR4, BTC/USD" required>
            </div>
            <div>
              <label for="type" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Instrumento</label>
              <input type="text" id="type" formControlName="type" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" placeholder="Ex: Ação, Criptomoeda" required>
            </div>
            <div>
              <label for="description" class="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
              <textarea id="description" formControlName="description" rows="4" class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5" placeholder="Descrição ou observações (opcional)"></textarea>
            </div>
          </form>
          <div class="p-6 border-t border-slate-200 dark:border-slate-700">
            <div class="flex justify-end space-x-4">
              <button type="button" (click)="closePanel()" class="text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancelar</button>
              <button type="button" (click)="saveInstrument()" [disabled]="instrumentForm.invalid" class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class InstrumentsComponent implements OnInit {
  private refresh$ = new BehaviorSubject<void>(undefined);

  instruments$: Observable<IInstrument[]>;

  isPanelOpen = false;
  panelTitle = '';
  instrumentForm: FormGroup;
  currentInstrumentId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private instrumentsService: InstrumentsService
  ) {
    this.instrumentForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
    });

    this.instruments$ = this.refresh$.pipe(
      switchMap(() => this.instrumentsService.getInstruments())
    );
  }

  ngOnInit(): void {}

  openPanel(instrument?: IInstrument): void {
    if (instrument) {
      this.panelTitle = 'Editar Instrumento';
      this.currentInstrumentId = instrument.id!;
      this.instrumentForm.setValue({
        name: instrument.name,
        type: instrument.type,
        description: instrument.description || ''
      });
    } else {
      this.panelTitle = 'Adicionar Novo Instrumento';
      this.currentInstrumentId = null;
      this.instrumentForm.reset({ type: '', description: '' });
    }
    this.isPanelOpen = true;
  }

  closePanel(): void {
    this.isPanelOpen = false;
  }

  saveInstrument(): void {
    if (this.instrumentForm.invalid) return;

    const formValue = this.instrumentForm.value;

    const saveObservable = this.currentInstrumentId
      ? this.instrumentsService.updateInstrument(this.currentInstrumentId, formValue)
      : this.instrumentsService.createInstrument(formValue);

    saveObservable.subscribe(() => {
      this.refresh$.next();
      this.closePanel();
    });
  }

  deleteInstrument(id: string): void {
    // Adicionar um modal de confirmação aqui seria uma boa prática
    this.instrumentsService.deleteInstrument(id).subscribe(() => {
        this.refresh$.next();
    });
  }
}
