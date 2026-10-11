import { Component, input } from '@angular/core';

/**
 * Cabeçalho de página: título, subtítulo e ações à direita.
 *
 * <vl-page-header title="Clientes" subtitle="Quem investe com a Valle">
 *   <button vl-button actions>Adicionar</button>
 * </vl-page-header>
 */
@Component({
  selector: 'vl-page-header',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-bold text-text leading-tight">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class VlPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
