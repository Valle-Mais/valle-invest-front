// src/app/security/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Erro ao descodificar o token', e);
      return null;
    }
  }

  /**
   * Obtém os dados do utilizador guardados no login.
   */
  getCurrentUser(): any | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded ? decoded.sub : null;
    }
    return null;
  }

  getUserRole(): 'admin' | 'client' | null {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded ? decoded.role : null;
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('currentUser'); // Limpa os dados do utilizador
    this.router.navigate(['/login']);
  }
}
