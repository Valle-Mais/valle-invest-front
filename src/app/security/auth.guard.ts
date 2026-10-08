// src/app/security/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service'; // Importa o nosso novo serviço

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // A lógica agora é centralizada no serviço.
  if (authService.isLoggedIn()) {
    return true; // Se está logado, permite o acesso.
  }

  // Se não está logado, redireciona para a página de login.
  router.navigate(['/login']);
  return false;
};
