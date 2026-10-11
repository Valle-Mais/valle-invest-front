import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { VlIconName } from '../icon/icons';

export type VlTone = 'neutral' | 'positive' | 'negative';

/**
 * Card de indicador. `hero` destaca o número principal da tela;
 * os demais ficam compactos. Cor só para positivo e negativo.
 * `hint` mostra um ícone de informação com a explicação do indicador
 * (tooltip no hover e no foco; no toque, abre ao tocar no ícone).
 */
@Component({
  selector: 'vl-kpi-card',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div [class]="cardClass()">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 min-w-0">
          <p [class]="labelClass()">{{ label() }}</p>
          @if (hint()) {
            <span class="relative group shrink-0 flex">
              <button
                type="button"
                class="flex rounded-full opacity-60 hover:opacity-100 focus-visible:opacity-100"
                [attr.aria-label]="'O que é ' + label() + '?'"
                [attr.aria-describedby]="hintId"
              >
                <lucide-icon name="info" [size]="14" />
              </button>
              <span
                role="tooltip"
                [id]="hintId"
                class="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-60 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-normal normal-case tracking-normal text-text shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {{ hint() }}
              </span>
            </span>
          }
        </div>
        @if (icon()) {
          <lucide-icon [name]="icon()!" [size]="18" class="shrink-0 opacity-70" />
        }
      </div>
      <p [class]="valueClass()">{{ value() }}</p>
      @if (delta()) {
        <p [class]="deltaClass()">
          {{ delta() }}
          @if (deltaLabel()) {
            <span class="opacity-70 font-normal">· {{ deltaLabel() }}</span>
          }
        </p>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class VlKpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly delta = input<string | null>();
  readonly deltaLabel = input<string>();
  readonly tone = input<VlTone>('neutral');
  readonly hero = input(false);
  readonly icon = input<VlIconName>();
  /** Explicação curta do indicador, mostrada em tooltip. */
  readonly hint = input<string>();

  private static seq = 0;
  readonly hintId = `vl-kpi-hint-${++VlKpiCardComponent.seq}`;

  readonly cardClass = computed(() =>
    this.hero()
      ? 'rounded-xl p-5 sm:p-6 lg:p-8 bg-primary text-on-primary min-w-0'
      : 'rounded-xl p-4 sm:p-5 bg-surface-raised text-text border border-border min-w-0',
  );

  readonly labelClass = computed(() =>
    `text-xs font-semibold uppercase tracking-wide ${this.hero() ? 'text-on-primary/70' : 'text-text-muted'}`,
  );

  readonly valueClass = computed(() => {
    const size = this.hero() ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-2xl';
    return `mt-2 num font-bold leading-tight break-words ${size} ${this.toneClass()}`;
  });

  readonly deltaClass = computed(() => `mt-1 text-xs sm:text-sm num font-semibold break-words ${this.toneClass()}`);

  private toneClass(): string {
    if (this.hero()) return '';
    if (this.tone() === 'positive') return 'text-positive';
    if (this.tone() === 'negative') return 'text-negative';
    return '';
  }
}
