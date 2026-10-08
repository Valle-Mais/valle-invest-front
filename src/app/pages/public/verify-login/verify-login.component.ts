// src/app/pages/public/verify-login/verify-login.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-login',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div class="text-center p-6">
        <p class="text-slate-600 dark:text-slate-400">{{ message }}</p>
      </div>
    </div>
  `,
})
export class VerifyLoginComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  message = 'A verificar a sua identidade, por favor aguarde...';
  private apiUrl = `${environment.apiUrl}/auth/verify-token`;

  ngOnInit(): void {
    // 1. Extrai o token da URL
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.message = 'Link de verificação inválido ou em falta.';
      return;
    }

    // 2. Envia o token para o back-end para verificação
    this.http.post<any>(this.apiUrl, { token }).subscribe({
      next: (response) => {
        // 3. O back-end validou o token e retornou o nosso token de acesso
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_role', response.user.role);

        this.message = 'Autenticado com sucesso! A redirecionar...';

        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/sistema']);
        }
      },
      error: (err) => {
        this.message = err.error.message || 'Erro na verificação. O link pode ser inválido ou ter expirado.';
        console.error(err);
      }
    });
  }
}
