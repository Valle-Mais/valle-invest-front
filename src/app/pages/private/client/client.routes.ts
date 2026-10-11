import { Routes } from '@angular/router';
import { ClientAreaLayoutComponent } from './layout/layout.component';

// Rotas da área do cliente, carregadas sob /sistema
export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientAreaLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Meu painel',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.ClientDashboardComponent),
      },
      {
        path: 'statement',
        title: 'Extrato',
        loadComponent: () => import('./statement/statement.component').then((m) => m.StatementComponent),
      },
      {
        path: 'solicitacoes',
        title: 'Solicitações',
        loadComponent: () => import('./requests/requests.component').then((m) => m.ClientRequestsComponent),
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./profile/profile.component').then((m) => m.ClientProfileComponent),
      },
      {
        path: 'alterar-senha',
        title: 'Alterar senha',
        loadComponent: () => import('../change-password/change-password.component').then((m) => m.ChangePasswordComponent),
      },
    ],
  },
];
