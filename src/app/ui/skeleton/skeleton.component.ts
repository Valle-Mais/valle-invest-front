import { Component } from '@angular/core';

/** Bloco de carregamento. Dimensões vêm das classes de quem usa: <vl-skeleton class="h-4 w-32" /> */
@Component({
  selector: 'vl-skeleton',
  standalone: true,
  template: '',
  host: { class: 'block animate-pulse rounded-md bg-surface-alt', 'aria-hidden': 'true' },
})
export class VlSkeletonComponent {}
