import { Component, computed, input } from '@angular/core';

export type VlBadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent';

const TONES: Record<VlBadgeTone, string> = {
  neutral: 'bg-surface-alt text-text-muted',
  positive: 'bg-positive-soft text-positive',
  negative: 'bg-negative-soft text-negative',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent-strong',
};

/** Etiqueta de status: Aprovado, Pendente, Ativo, Aporte... */
@Component({
  selector: 'vl-badge',
  standalone: true,
  template: `<ng-content />`,
  host: { '[class]': 'hostClass()' },
})
export class VlBadgeComponent {
  readonly tone = input<VlBadgeTone>('neutral');
  readonly hostClass = computed(
    () => `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TONES[this.tone()]}`,
  );
}
