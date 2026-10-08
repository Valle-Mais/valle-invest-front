import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../security/auth.service'; // Importar o AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
})
export class LoginPageComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // Injetar o AuthService
  private router = inject(Router);       // Injetar o Router

  email = '';
  linkSent = signal(false);
  isLoading = signal(false);
  errorMessage: string | null = null;

  private apiUrl = `${environment.apiUrl}/auth/request-link`;

  ngOnInit(): void {
    // **LÓGICA DE REDIRECIONAMENTO ADICIONADA AQUI**
    // Verifica se o utilizador já está logado quando o componente é inicializado.
    if (this.authService.isLoggedIn()) {
      const userRole = this.authService.getUserRole();

      // Redireciona com base na função do utilizador.
      if (userRole === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/client/dashboard']);
      }
    }
  }

  requestLink(): void {
    if (!this.email) return;

    this.isLoading.set(true);
    this.errorMessage = null;

    const payload = {
      email: this.email,
      origin: window.location.origin
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.linkSent.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Ocorreu um erro. Tente novamente.';
        this.isLoading.set(false);
      }
    });
  }
}
