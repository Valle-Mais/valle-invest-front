import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'access_token';
const SESSION_KEYS = [TOKEN_KEY, 'user_role', 'currentUser'];

/**
 * Injeta o Bearer token nas chamadas à API e encerra a sessão em 401.
 *
 * Só toca requisições para environment.apiUrl; chamadas externas (ex.: BCB)
 * seguem sem header. Erros 401 vindos de /auth/* não derrubam a sessão,
 * porque ali 401 significa "token de login inválido", não "sessão expirada".
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isApiCall = req.url.startsWith(environment.apiUrl);
  const token = localStorage.getItem(TOKEN_KEY);

  const request =
    isApiCall && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isAuthRoute = req.url.includes('/auth/');
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiCall &&
        !isAuthRoute
      ) {
        SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
