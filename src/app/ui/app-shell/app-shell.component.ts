import { Component, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { VlNavItem } from '../nav-item';
import { VlBottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { VlButtonComponent } from '../button/button.component';
import { VlLogoComponent } from '../logo/logo.component';

/**
 * Casca das áreas logadas: sidebar com navegação, header com usuário,
 * ações de conta (tema, alterar senha, sair) e bottom nav no mobile.
 * Os layouts de admin e cliente só informam os itens de menu.
 */
@Component({
  selector: 'vl-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, VlBottomNavComponent, VlButtonComponent, VlLogoComponent],
  templateUrl: './app-shell.component.html',
})
export class VlAppShellComponent {
  readonly navItems = input.required<VlNavItem[]>();
  /** Itens da navegação inferior. Default: os três primeiros do menu. */
  readonly bottomNavItems = input<VlNavItem[]>();
  /** Texto sob o nome da marca: "Administração", "Área do cliente". */
  readonly areaLabel = input('');
  readonly changePasswordLink = input('alterar-senha');

  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);

  readonly bottomNav = computed(() => this.bottomNavItems() ?? this.navItems().slice(0, 3));
  readonly userName = computed(() => this.auth.currentUser()?.name || '');
  readonly roleLabel = computed(() => (this.auth.role() === 'admin' ? 'Administrador' : 'Cliente'));
  readonly initials = computed(() => {
    const name = this.userName().trim();
    if (!name) return '·';
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));
  }

  logout(): void {
    this.auth.logout();
  }
}
