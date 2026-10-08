import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-client-area-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-sans">

      <!-- Overlay Mobile -->
      <div *ngIf="isMobileMenuOpen()"
           (click)="isMobileMenuOpen.set(false)"
           class="fixed inset-0 bg-black/50 z-20 lg:hidden"></div>

      <!-- Sidebar fixo -->
      <aside [class.translate-x-0]="isMobileMenuOpen()"
             [class.-translate-x-full]="!isMobileMenuOpen()"
             class="fixed top-0 left-0 z-30 w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0">

        <!-- Logo -->
    <div class="h-40 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 mt-4 mb-2">
  <img
    src="android-chrome-512x512.png"
    alt="Valle Admin Logo"
    class="h-40 w-auto"
  />
</div>

        <!-- Navegação -->
        <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <a routerLink="dashboard" routerLinkActive="bg-emerald-600 text-white shadow-md"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Meu Painel</span>
          </a>

          <a routerLink="statement" routerLinkActive="bg-emerald-600 text-white shadow-md"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Extrato Financeiro</span>
          </a>
        </nav>

        <!-- Rodapé -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800">
          <button (click)="logout()"
                  class="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <!-- Conteúdo Principal -->
      <div class="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <!-- Cabeçalho -->
        <header class="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:justify-end px-4 sm:px-8 flex-shrink-0">
          <button (click)="isMobileMenuOpen.set(true)" class="lg:hidden text-slate-500 dark:text-slate-400 p-2 -ml-2">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {{ userInitials() }}
            </div>
            <div class="hidden sm:block">
              <div class="font-bold text-slate-800 dark:text-slate-100">{{ userName() }}</div>
              <div class="text-xs text-slate-500 capitalize">{{ userRole() }}</div>
            </div>
          </div>
        </header>

        <!-- Conteúdo rolável -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class ClientAreaLayoutComponent {
  isMobileMenuOpen = signal(false);
  private currentUser;

  userName = computed(() => this.currentUser()?.name || 'Cliente');
  userRole = computed(() => this.currentUser()?.role || 'client');
  userInitials = computed(() => {
    const name = this.currentUser()?.name || 'Cliente';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = toSignal(this.authService.currentUser$);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
