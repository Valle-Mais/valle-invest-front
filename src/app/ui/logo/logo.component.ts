import { Component, computed, input } from '@angular/core';

export type VlLogoVariant = 'icon' | 'horizontal';

/**
 * Lockup Valle+Invest: símbolo de investimentos (linha ascendente) em verde
 * num círculo dourado e a palavra "Valle+Invest" na cor do texto do tema.
 *
 * - `icon`: só o círculo com o símbolo. `horizontal`: círculo + nome.
 * - `onDark`: texto em creme para o painel verde do login. Sem ele, o texto segue o tema.
 *
 * O favicon e os PNGs em public/ usam o mesmo desenho (ver favicon.svg).
 */
@Component({
  selector: 'vl-logo',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="variant() === 'horizontal' ? '0 0 300 64' : '0 0 64 64'"
      [attr.height]="size()"
      [attr.width]="variant() === 'horizontal' ? size() * 4.6875 : size()"
      role="img"
      [attr.aria-label]="variant() === 'horizontal' ? 'Valle+Invest' : 'Valle'"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" [attr.fill]="gold" />
      <path d="M15 44 L25 32 L31 38.5 L47 20 H36" [attr.stroke]="green" stroke-width="5.5" stroke-linejoin="miter" stroke-linecap="butt" stroke-miterlimit="4" />
      @if (variant() === 'horizontal') {
        <text x="76" y="44" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="36" letter-spacing="-0.5" [attr.fill]="text()">Valle+Invest</text>
      }
    </svg>
  `,
  host: { class: 'inline-block leading-none align-middle' },
})
export class VlLogoComponent {
  readonly variant = input<VlLogoVariant>('icon');
  /** Altura em px. */
  readonly size = input(32);
  /** Fundo verde fixo (login): texto em creme. */
  readonly onDark = input(false);

  readonly gold = '#C7A84C';
  readonly green = '#1E462E';
  readonly text = computed(() => (this.onDark() ? '#F0EAD6' : 'var(--vl-text)'));
}
