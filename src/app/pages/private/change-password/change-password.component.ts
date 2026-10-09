import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { PASSWORD_POLICY_MESSAGE, isPasswordValid } from '../../../core/auth/password-policy';

/** Troca de senha do usuário logado. Usada nas áreas de admin e de cliente. */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);

  readonly policyMessage = PASSWORD_POLICY_MESSAGE;

  currentPassword = '';
  newPassword = '';
  confirm = '';
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.isLoading()) return;
    this.successMessage.set(null);

    if (!isPasswordValid(this.newPassword)) {
      this.errorMessage.set(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (this.newPassword !== this.confirm) {
      this.errorMessage.set('As senhas não coincidem.');
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.errorMessage.set('A nova senha precisa ser diferente da atual.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'Senha alterada com sucesso.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirm = '';
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Não foi possível alterar a senha.');
      },
    });
  }
}
