// Transição: valida o magic link antigo. Sai quando o login por senha
// estiver consolidado (Fase 5 do plano).
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-login',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div class="text-center p-6">
        <p class="text-slate-600 dark:text-slate-400">{{ message }}</p>
      </div>
    </div>
  `,
})
export class VerifyLoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  message = 'Verificando seu acesso, aguarde...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message = 'Link de verificação inválido ou incompleto.';
      return;
    }

    this.auth.verifyMagicLink(token).subscribe({
      next: () => {
        this.message = 'Autenticado. Redirecionando...';
        this.auth.redirectHome();
      },
      error: (err) => {
        this.message = err.error?.message || 'Erro na verificação. O link pode ser inválido ou ter expirado.';
      },
    });
  }
}
