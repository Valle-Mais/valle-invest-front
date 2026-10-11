import { Routes } from '@angular/router';

// Rotas da área do admin, carregadas sob /admin
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'clients',
        title: 'Clientes',
        loadComponent: () => import('./clients/clients.component').then((m) => m.ClientsComponent),
      },
      {
        path: 'clients/:id',
        title: 'Cliente',
        loadComponent: () => import('./client-detail/client-detail.component').then((m) => m.ClientDetailComponent),
      },
      // Compatibilidade com links antigos.
      { path: 'client-view', redirectTo: 'clients' },
      {
        path: 'fund-operations',
        title: 'Operações do fundo',
        loadComponent: () => import('./fund-operations/fund-operations.component').then((m) => m.FundOperationsComponent),
      },
      {
        path: 'client-transactions',
        title: 'Aportes e resgates',
        loadComponent: () => import('./client-transactions/client-transactions.component').then((m) => m.ClientTransactionsComponent),
      },
      {
        path: 'alterar-senha',
        title: 'Alterar senha',
        loadComponent: () => import('../change-password/change-password.component').then((m) => m.ChangePasswordComponent),
      },
    ],
  },
];
