// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/public/login/login.component';
import { VerifyLoginComponent } from './pages/public/verify-login/verify-login.component';
import { authGuard } from './security/auth.guard';
import { roleGuard } from './security/role.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  // Públicas. guestGuard manda usuário logado para a área dele.
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent, canActivate: [guestGuard], title: 'Entrar | Valle Consultoria' },
  {
    path: 'esqueci-senha',
    canActivate: [guestGuard],
    title: 'Recuperar senha | Valle Consultoria',
    loadComponent: () =>
      import('./pages/public/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    // Primeiro acesso e redefinição usam a mesma tela; o token vem na query.
    path: 'definir-senha',
    title: 'Definir senha | Valle Consultoria',
    loadComponent: () =>
      import('./pages/public/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  // Transição do magic link.
  { path: 'verify-login', component: VerifyLoginComponent, title: 'Verificando acesso' },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'admin' },
    loadChildren: () => import('./pages/private/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  // Cliente
  {
    path: 'sistema',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'client' },
    loadChildren: () => import('./pages/private/client/client.routes').then((m) => m.CLIENT_ROUTES),
  },

  { path: '**', redirectTo: '' },
];
