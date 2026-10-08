// src/app/pages/private/admin/daily-results/daily-results.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../security/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-daily-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Resultados Diários</h1>
        <p class="text-slate-500 dark:text-slate-400">Insira a percentagem de desempenho do fundo para cada dia.</p>
      </div>
      <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <form (ngSubmit)="saveResult()" class="flex items-end gap-4">
          <div>
            <label class="block text-sm font-medium">Data</label>
            <input type="date" name="date" [(ngModel)]="newResult.date" class="mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium">Resultado (%)</label>
            <input type="number" step="0.01" name="percentage" [(ngModel)]="newResult.percentage" placeholder="Ex: 1.25" class="mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg">
          </div>
          <button type="submit" class="py-2 px-4 text-sm font-semibold bg-sv-green text-white rounded-lg">Salvar Resultado</button>
        </form>
      </div>
    </div>
  `
})
export class DailyResultsComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/daily-results`;

  newResult = {
    date: new Date().toISOString().split('T')[0],
    percentage: null
  };

  saveResult() {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.post(this.apiUrl, this.newResult, { headers }).subscribe(() => {
      alert('Resultado salvo com sucesso!');
      this.newResult.percentage = null;
    });
  }
}
