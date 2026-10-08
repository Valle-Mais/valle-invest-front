import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Define o tipo para garantir que apenas 'light' ou 'dark' sejam usados.
type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // 1. Usa um 'signal' do Angular para guardar o tema atual. O valor inicial é determinado no construtor.
  theme = signal<Theme>('light');

  // Injeta o PLATFORM_ID para verificar se o código está a ser executado no navegador.
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // 2. A lógica de inicialização é movida para o construtor para ser executada assim que o serviço é criado.
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') as Theme | null;

      if (savedTheme) {
        // Se houver um tema guardado, usa-o.
        this.theme.set(savedTheme);
      } else {
        // Caso contrário, verifica a preferência do sistema operativo do utilizador.
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme.set(prefersDark ? 'dark' : 'light');
      }
    }

    // 3. Um 'effect' é executado automaticamente sempre que o 'signal' do tema muda.
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        // Guarda a preferência de tema no armazenamento local do navegador.
        localStorage.setItem('theme', this.theme());

        // Adiciona ou remove a classe 'dark' do elemento <html>.
        // É esta classe que o Tailwind CSS usa para aplicar os estilos do modo escuro.
        if (this.theme() === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  /**
   * Alterna o tema entre 'light' e 'dark'.
   * Este método é chamado pelo botão no ThemeToggleComponent.
   */
  toggleTheme(): void {
    this.theme.update((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light'
    );
  }
}
