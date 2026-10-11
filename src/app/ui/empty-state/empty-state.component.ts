import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { VlIconName } from '../icon/icons';

/** Estado vazio de listas e tabelas, com ação opcional projetada. */
@Component({
  selector: 'vl-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col items-center text-center py-10 px-4">
      <div class="h-12 w-12 rounded-full bg-surface-alt text-text-muted flex items-center justify-center">
        <lucide-icon [name]="icon()" [size]="22" />
      </div>
      <h3 class="mt-4 font-sans text-base font-semibold text-text">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-1 text-sm text-text-muted max-w-sm">{{ description() }}</p>
      }
      <div class="mt-4 empty:hidden"><ng-content /></div>
    </div>
  `,
  host: { class: 'block' },
})
export class VlEmptyStateComponent {
  readonly icon = input<VlIconName>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
