import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type VlButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type VlButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const SIZES: Record<VlButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const VARIANTS: Record<VlButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary: 'bg-surface-raised text-text border border-border hover:bg-surface-alt',
  ghost: 'text-text-muted hover:bg-surface-alt hover:text-text',
  danger: 'bg-negative text-white hover:opacity-90',
};

/**
 * Botão do design system. Aplica-se ao elemento nativo, então `type="submit"`,
 * `routerLink` e demais atributos continuam funcionando.
 *
 * <button vl-button variant="primary" [loading]="saving()">Salvar</button>
 * <a vl-button variant="secondary" routerLink="/login">Voltar</a>
 */
@Component({
  selector: 'button[vl-button], a[vl-button]',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (loading()) {
      <lucide-icon name="loader-circle" [size]="16" class="animate-spin shrink-0" />
    }
    <ng-content />
  `,
  host: {
    '[class]': 'hostClass()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading()',
  },
})
export class VlButtonComponent {
  readonly variant = input<VlButtonVariant>('primary');
  readonly size = input<VlButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly block = input(false);

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly hostClass = computed(() =>
    [BASE, SIZES[this.size()], VARIANTS[this.variant()], this.block() ? 'w-full' : ''].join(' '),
  );
}
