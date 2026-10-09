import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'alterar-senha',
        title: 'Alterar senha',
        loadComponent: () =>
          import('../change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'client-view',
        title: 'Visão do Cliente',
        loadComponent: () =>
          import('../client/dashboard/dashboard.component').then( // Carrega o dashboard do cliente
            (m) => m.ClientDashboardComponent
          ),
      },
      {
        path: 'clients',
        title: 'Gestão de Usuários',
        loadComponent: () =>
          import('./clients/clients.component').then((m) => m.ClientsComponent),
      },
      // {
      //   path: 'instruments', // ROTA ADICIONADA
      //   title: 'Gestão de Instrumentos',
      //   loadComponent: () =>
      //     import('./instruments/instruments.component').then(
      //       (m) => m.InstrumentsComponent
      //     ),
      // },
      {
        path: 'fund-operations',
        title: 'Operações do Fundo',
        loadComponent: () =>
          import('./fund-operations/fund-operations.component').then(
            (m) => m.FundOperationsComponent
          ),
      },
      {
        path: 'client-transactions',
        title: 'Aportes e Resgates',
        loadComponent: () =>
          import('./client-transactions/client-transactions.component').then(
            (m) => m.ClientTransactionsComponent
          ),
      },
    ],
  },
];
