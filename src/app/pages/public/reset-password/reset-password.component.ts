import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { PASSWORD_POLICY_MESSAGE, isPasswordValid } from '../../../core/auth/password-policy';
import { VlButtonComponent, VlFieldComponent, VlInputDirective, VlLogoComponent } from '../../../ui';

/**
 * Define a senha a partir de um link por email. Serve para o primeiro acesso
 * (convite) e para a redefinição (esqueci a senha): a API aceita os dois tokens.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, VlButtonComponent, VlFieldComponent, VlInputDirective, VlLogoComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly token = this.route.snapshot.queryParamMap.get('token');
  readonly policyMessage = PASSWORD_POLICY_MESSAGE;

  password = '';
  confirm = '';
  readonly isLoading = signal(false);
  readonly done = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (!this.token || this.isLoading()) return;

    if (!isPasswordValid(this.password)) {
      this.errorMessage.set(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (this.password !== this.confirm) {
      this.errorMessage.set('As senhas não coincidem.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.done.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Não foi possível definir a senha. Peça um novo link.');
      },
    });
  }
}
