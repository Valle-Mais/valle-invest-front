import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { VlButtonComponent } from '../button/button.component';

/** Paginação simples: página atual de N, anterior e próximo. */
@Component({
  selector: 'vl-pagination',
  standalone: true,
  imports: [LucideAngularModule, VlButtonComponent],
  template: `
    <div class="flex items-center justify-between gap-4 px-5 py-4 text-sm">
      <span class="text-text-muted num">
        Página <strong class="text-text">{{ page() }}</strong> de <strong class="text-text">{{ totalPages() }}</strong>
      </span>
      <div class="flex items-center gap-2">
        <button vl-button variant="secondary" size="sm" type="button" [disabled]="page() <= 1" (click)="go(page() - 1)">
          <lucide-icon name="chevron-left" [size]="16" />
          Anterior
        </button>
        <button vl-button variant="secondary" size="sm" type="button" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">
          Próximo
          <lucide-icon name="chevron-right" [size]="16" />
        </button>
      </div>
    </div>
  `,
  host: { class: 'block border-t border-border' },
})
export class VlPaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  go(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }
}
