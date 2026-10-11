// Transição: valida o magic link antigo. Sai quando o login por senha
// estiver consolidado (Fase 5 do plano).
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { VlButtonComponent } from '../../../ui';

@Component({
  selector: 'app-verify-login',
  standalone: true,
  imports: [RouterLink, VlButtonComponent],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-surface p-6">
      <div class="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-8 text-center space-y-4">
        <p class="text-text">{{ message() }}</p>
        @if (failed()) {
          <a vl-button variant="secondary" routerLink="/login">Ir para o login</a>
        }
      </div>
    </div>
  `,
})
export class VerifyLoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly message = signal('Verificando seu acesso, aguarde...');
  readonly failed = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message.set('Link de verificação inválido ou incompleto.');
      this.failed.set(true);
      return;
    }

    this.auth.verifyMagicLink(token).subscribe({
      next: () => {
        this.message.set('Autenticado. Redirecionando...');
        this.auth.redirectHome();
      },
      error: (err) => {
        this.message.set(err.error?.message || 'Erro na verificação. O link pode ser inválido ou ter expirado.');
        this.failed.set(true);
      },
    });
  }
}
