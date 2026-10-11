import { Component, input } from '@angular/core';

/**
 * Envolve um controle de formulário com label, dica e erro.
 *
 * <vl-field label="Email" inputId="email" [error]="emailError()">
 *   <input vlInput id="email" type="email" [(ngModel)]="email" />
 * </vl-field>
 */
@Component({
  selector: 'vl-field',
  standalone: true,
  template: `
    @if (label()) {
      <label [attr.for]="inputId()" class="block text-sm font-medium text-text mb-1.5">
        {{ label() }}
        @if (required()) {
          <span class="text-negative" aria-hidden="true">*</span>
        }
      </label>
    }
    <ng-content />
    @if (error()) {
      <p class="mt-1.5 text-xs text-negative" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p class="mt-1.5 text-xs text-text-muted">{{ hint() }}</p>
    }
  `,
  host: { class: 'block' },
})
export class VlFieldComponent {
  readonly label = input<string>();
  readonly inputId = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  readonly required = input(false);
}
