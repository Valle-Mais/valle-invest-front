import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Rotas de visitante (login, esqueci a senha): usuário logado vai para a área dele. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  return router.parseUrl(auth.homeFor(auth.getUserRole()));
};
