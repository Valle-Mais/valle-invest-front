import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeService } from '../../../../services/theme.service';
import { ToastService, VlButtonComponent, VlFieldComponent, VlInputDirective, VlPageHeaderComponent } from '../../../../ui';

/** Perfil do cliente: dados de contato, tema, senha e saída. */
@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule, VlPageHeaderComponent, VlFieldComponent, VlInputDirective, VlButtonComponent],
  templateUrl: './profile.component.html',
})
export class ClientProfileComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  readonly user = computed(() => this.auth.currentUser());
  phone = '';
  private phoneSynced = false;
  readonly saving = signal(false);

  constructor() {
    // Preenche o telefone quando o usuário carregar.
    const sync = () => {
      const u = this.user();
      if (u && !this.phoneSynced) {
        this.phone = u.phone ?? '';
        this.phoneSynced = true;
      }
    };
    sync();
    this.auth.currentUser$.subscribe(sync);
  }

  save(): void {
    this.saving.set(true);
    this.auth.updateProfile({ phone: this.phone }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Dados de contato atualizados.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Não foi possível salvar.');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
