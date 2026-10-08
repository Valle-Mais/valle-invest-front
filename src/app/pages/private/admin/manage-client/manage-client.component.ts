// src/app/pages/private/admin/manage-client/manage-client.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../security/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-manage-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">{{ selectedClient ? 'Gerir Capital: ' + selectedClient.name : 'Selecionar Cliente' }}</h1>
          <p class="text-slate-500 dark:text-slate-400">Registe aportes e resgates para o cliente.</p>
        </div>
        <select (change)="onClientChange($event)" [ngModel]="selectedClientId" class="w-full sm:w-64 px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg">
          <option [ngValue]="null" disabled>Selecione um cliente...</option>
          <option *ngFor="let client of allClients" [value]="client.id">{{ client.name }}</option>
        </select>
      </div>
      <div *ngIf="selectedClient" class="bg-white dark:bg-slate-900 p-6 rounded-xl border">
        <h3 class="text-base font-semibold mb-4">Nova Transação</h3>
        <form (ngSubmit)="addTransaction()" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <input type="date" name="date" [(ngModel)]="newTransaction.date" class="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg">
          <select name="type" [(ngModel)]="newTransaction.type" class="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg">
            <option>Aporte</option>
            <option>Resgate</option>
          </select>
          <input type="number" name="value" [(ngModel)]="newTransaction.value" placeholder="Valor (R$)" class="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg">
          <button type="submit" class="sm:col-start-3 py-2 text-sm font-semibold bg-sv-green text-white rounded-lg">Registar Transação</button>
        </form>
      </div>
    </div>
  `
})
export class ManageClientComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  allClients: any[] = [];
  selectedClientId: string | null = null;
  selectedClient: any = null;

  newTransaction = {
    date: new Date().toISOString().split('T')[0],
    type: 'Aporte',
    value: null
  };

  ngOnInit(): void {
    this.fetchAllClients();
    this.route.paramMap.subscribe(params => {
      this.selectedClientId = params.get('id');
      if (this.selectedClientId && this.allClients.length > 0) {
        this.selectedClient = this.allClients.find(c => c.id === this.selectedClientId);
      }
    });
  }

  fetchAllClients(): void {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.get<any[]>(`${this.apiUrl}/users`, { headers }).subscribe(users => {
      this.allClients = users.filter(u => u.role === 'client');
      if (this.selectedClientId) {
        this.selectedClient = this.allClients.find(c => c.id === this.selectedClientId);
      }
    });
  }

  onClientChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.router.navigate(['/admin/manage-client', id]);
  }

  addTransaction() {
    if (!this.selectedClientId || !this.newTransaction.value) return;
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.post(`${this.apiUrl}/portfolios/${this.selectedClientId}/transactions`, this.newTransaction, { headers })
      .subscribe(() => {
        alert('Transação registada com sucesso!');
        this.newTransaction.value = null;
      });
  }
}
