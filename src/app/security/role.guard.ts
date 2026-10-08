// src/app/security/role.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service'; // Importa o nosso novo serviço

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtém o papel esperado da configuração da rota (ex: data: { expectedRole: 'admin' })
  const expectedRole = route.data['expectedRole'];
  // Obtém o papel atual do utilizador a partir do token JWT
  const userRole = authService.getUserRole();

  // Verifica se o utilizador está logado e se o seu papel corresponde ao esperado.
  if (authService.isLoggedIn() && userRole === expectedRole) {
    return true; // Permite o acesso.
  }

  // Se o utilizador estiver logado mas não tiver o papel correto,
  // podemos redirecioná-lo para o seu próprio dashboard para evitar confusão.
  if (authService.isLoggedIn()) {
    if (userRole === 'admin') {
      router.navigate(['/admin']);
    } else if (userRole === 'client') {
      router.navigate(['/sistema']);
    } else {
      router.navigate(['/login']); // Caso de segurança
    }
    return false;
  }

  // Se não estiver logado, redireciona para a página de login.
  router.navigate(['/login']);
  return false;
};
