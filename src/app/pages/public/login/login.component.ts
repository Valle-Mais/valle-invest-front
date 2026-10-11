import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, MUST_SET_PASSWORD } from '../../../core/auth/auth.service';
import { VlButtonComponent, VlFieldComponent, VlInputDirective, VlLogoComponent } from '../../../ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, VlButtonComponent, VlFieldComponent, VlInputDirective, VlLogoComponent],
  templateUrl: './login.component.html',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);

  email = '';
  password = '';

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** Usuário existe mas ainda não definiu senha: oferece o envio do link. */
  readonly mustSetPassword = signal(false);
  readonly linkSent = signal(false);

  submit(): void {
    if (!this.email || !this.password || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.mustSetPassword.set(false);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.auth.redirectHome(),
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 403 && err.error?.code === MUST_SET_PASSWORD) {
          this.mustSetPassword.set(true);
          return;
        }
        if (err.status === 429) {
          this.errorMessage.set('Muitas tentativas. Aguarde um minuto e tente de novo.');
          return;
        }
        this.errorMessage.set(err.error?.message || 'Não foi possível entrar. Tente novamente.');
      },
    });
  }

  /** Envia o link para definir a senha (primeiro acesso ou convite perdido). */
  sendSetPasswordLink(): void {
    if (!this.email || this.isLoading()) return;
    this.isLoading.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.linkSent.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Não foi possível enviar o link. Tente novamente.');
      },
    });
  }
}
