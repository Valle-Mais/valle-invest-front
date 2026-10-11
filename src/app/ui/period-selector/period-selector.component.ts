import { Component, input, model } from '@angular/core';

export interface VlPeriodOption {
  /** Valor enviado à API (hoje as strings que ela aceita). */
  value: string;
  label: string;
}

/** Enum curto aceito por /performance (a API também entende as strings legadas). */
export const DEFAULT_PERIODS: VlPeriodOption[] = [
  { value: 'mes', label: 'Mês' },
  { value: '6m', label: '6M' },
  { value: 'ano', label: 'Ano' },
  { value: 'inicio', label: 'Desde o início' },
];

/** Seletor segmentado de período, único para cards, gráfico e tabela. */
@Component({
  selector: 'vl-period-selector',
  standalone: true,
  template: `
    <div class="inline-flex items-center gap-1 rounded-lg bg-surface-alt p-1" role="tablist">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="opt.value === value()"
          (click)="value.set(opt.value)"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          [class]="opt.value === value()
            ? 'bg-surface-raised text-primary shadow-sm'
            : 'text-text-muted hover:text-text'"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  host: { class: 'inline-block' },
})
export class VlPeriodSelectorComponent {
  readonly options = input<VlPeriodOption[]>(DEFAULT_PERIODS);
  readonly value = model<string>('inicio');
}
