import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface VlCellContext<T = unknown> {
  $implicit: T;
  column: string;
}

/**
 * Template customizado para uma coluna do <vl-data-table>.
 *
 * <ng-template vlCell="status" let-row>
 *   <vl-badge [tone]="...">{{ row.status }}</vl-badge>
 * </ng-template>
 */
@Directive({
  selector: 'ng-template[vlCell]',
  standalone: true,
})
export class VlCellDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'vlCell' });
  readonly template = inject<TemplateRef<VlCellContext<T>>>(TemplateRef);
}
