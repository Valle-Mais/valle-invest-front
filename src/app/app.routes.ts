// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/public/login/login.component';
import { VerifyLoginComponent } from './pages/public/verify-login/verify-login.component'; // Importe aqui
import { authGuard } from './security/auth.guard';
import { roleGuard } from './security/role.guard';

export const routes: Routes = [
  // Rotas Públicas
  { path: '', component: LoginPageComponent, title: 'Valle Consultoria' },
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'verify-login', component: VerifyLoginComponent, title: 'A Verificar...' }, // Adicione esta rota

  // Rota Privada para o ADMIN
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'admin' },
    loadChildren: () =>
        import('./pages/private/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  // Rota Privada para o CLIENTE
  {
    path: 'sistema',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'client' },
    loadChildren: () =>
        import('./pages/private/client/client.routes').then(m => m.CLIENT_ROUTES),
  },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
