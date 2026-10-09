import { Routes } from '@angular/router';
import { ClientAreaLayoutComponent } from './layout/layout.component';
import { OperationsComponent } from './operations/operations.component';
import { StatementComponent } from './statement/statement.component';
import { ClientDashboardComponent } from './dashboard/dashboard.component';

// Rotas da área do cliente, carregadas sob /sistema
export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientAreaLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientDashboardComponent, title: 'Meu Painel' },
      { path: 'statement', component: StatementComponent, title: 'Extrato Financeiro' },
      // Dados fixos de 2024; sai na Fase 3 do plano.
      { path: 'operations', component: OperationsComponent, title: 'Relação de Operações' },
      {
        path: 'alterar-senha',
        title: 'Alterar senha',
        loadComponent: () =>
          import('../change-password/change-password.component').then((m) => m.ChangePasswordComponent),
      },
    ],
  },
];
