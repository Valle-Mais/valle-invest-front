import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IUser } from '../../services/clients.service';

export type UserRole = 'admin' | 'client';

export interface SessionResponse {
  access_token: string;
  user: IUser;
}

/** Código devolvido pela API no 403 de login quando o usuário ainda não definiu senha. */
export const MUST_SET_PASSWORD = 'MUST_SET_PASSWORD';

const TOKEN_KEY = 'access_token';
/** Chaves gravadas por versões antigas do front; limpas no logout. */
const LEGACY_KEYS = ['user_role', 'currentUser'];

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

/**
 * Único serviço de autenticação do front.
 *
 * - Sessão: token JWT no localStorage, enviado pelo authInterceptor.
 * - Usuário atual: carregado de GET /auth/me quando há token; exposto como
 *   signal (`currentUser`) e, para o código legado, como observable
 *   (`currentUser$`) e getter (`currentUserValue`). `undefined` = carregando,
 *   `null` = deslogado.
 * - Fluxos: login com senha, esqueci/definir senha, troca de senha,
 *   reenvio de convite (admin) e magic link (transição).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<IUser | null | undefined>(undefined);
  readonly currentUser$ = toObservable(this.currentUser);
  readonly role = computed<UserRole | null>(() => this.currentUser()?.role ?? this.getUserRole());

  constructor() {
    this.loadCurrentUser();
  }

  // --- Sessão -----------------------------------------------------------

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const payload = this.decode(this.getToken());
    return !!payload && payload.exp * 1000 > Date.now();
  }

  getUserRole(): UserRole | null {
    return this.decode(this.getToken())?.role ?? null;
  }

  getUserId(): string | null {
    return this.decode(this.getToken())?.sub ?? null;
  }

  get currentUserValue(): IUser | null | undefined {
    return this.currentUser();
  }

  /** Rota inicial de cada papel. */
  homeFor(role: UserRole | null): string {
    return role === 'admin' ? '/admin' : '/sistema';
  }

  redirectHome(): void {
    this.router.navigateByUrl(this.homeFor(this.role()));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // --- Login com senha ----------------------------------------------------

  login(email: string, password: string): Observable<SessionResponse> {
    return this.http
      .post<SessionResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((session) => this.setSession(session)));
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, {
      email,
      origin: window.location.origin,
    });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, password });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/password`, { currentPassword, newPassword });
  }

  /** Dados de contato do próprio usuário. Atualiza o currentUser com a resposta. */
  updateProfile(fields: { phone?: string }): Observable<IUser> {
    return this.http
      .patch<IUser>(`${this.apiUrl}/profile`, fields)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Admin reenvia o convite de primeiro acesso. */
  resendInvite(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/invite/resend`, {
      userId,
      origin: window.location.origin,
    });
  }

  // --- Magic link (transição) --------------------------------------------

  verifyMagicLink(token: string): Observable<SessionResponse> {
    return this.http
      .post<SessionResponse>(`${this.apiUrl}/verify-token`, { token })
      .pipe(tap((session) => this.setSession(session)));
  }

  // --- Internos -----------------------------------------------------------

  private setSession(session: SessionResponse): void {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    this.currentUser.set(session.user);
  }

  private loadCurrentUser(): void {
    if (!this.isLoggedIn()) {
      if (this.getToken()) localStorage.removeItem(TOKEN_KEY);
      this.currentUser.set(null);
      return;
    }

    this.http
      .get<IUser>(`${this.apiUrl}/me`)
      .pipe(catchError(() => of(null)))
      .subscribe((user) => this.currentUser.set(user));
  }

  private decode(token: string | null): JwtPayload | null {
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
