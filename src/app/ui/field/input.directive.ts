import { Directive, computed, input } from '@angular/core';

const BASE =
  'block w-full rounded-lg border bg-surface-raised text-text text-sm px-3.5 py-2.5 ' +
  'placeholder:text-text-muted/70 focus:border-primary ' +
  'disabled:bg-surface-alt disabled:text-text-muted disabled:cursor-not-allowed';

/** Estilo padrão de input, select e textarea. Combinar com <vl-field>. */
@Directive({
  selector: 'input[vlInput], select[vlInput], textarea[vlInput]',
  standalone: true,
  host: { '[class]': 'hostClass()' },
})
export class VlInputDirective {
  readonly invalid = input(false);
  readonly hostClass = computed(() => `${BASE} ${this.invalid() ? 'border-negative' : 'border-border'}`);
}
