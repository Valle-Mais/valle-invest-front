import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  email = '';
  readonly isLoading = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (!this.email || this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.sent.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 429
            ? 'Muitas tentativas. Aguarde um minuto e tente de novo.'
            : err.error?.message || 'Não foi possível enviar o link. Tente novamente.',
        );
      },
    });
  }
}
