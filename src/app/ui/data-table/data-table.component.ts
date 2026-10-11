import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, contentChildren, input, viewChild } from '@angular/core';
import { VlCellContext, VlCellDirective } from './cell.directive';
import { VlSkeletonComponent } from '../skeleton/skeleton.component';
import { VlEmptyStateComponent } from '../empty-state/empty-state.component';

export interface VlColumn<T = any> {
  /** Chave da coluna; sem `cell`, lê `row[key]`. */
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  /** Formata o valor da célula. Para HTML, usar <ng-template vlCell="key">. */
  cell?: (row: T) => string | number | null | undefined;
  /** Não aparece na lista do mobile. */
  hideOnMobile?: boolean;
  /** Classes extras na célula (ex.: 'num font-medium'). */
  class?: string;
}

/**
 * Tabela declarativa. No desktop é <table>; abaixo de md vira lista de cards,
 * um por linha, com rótulo e valor por coluna. Estados de carregando e vazio inclusos.
 */
@Component({
  selector: 'vl-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, VlCellDirective, VlSkeletonComponent, VlEmptyStateComponent],
  templateUrl: './data-table.component.html',
  host: { class: 'block' },
})
export class VlDataTableComponent<T = any> {
  readonly columns = input.required<VlColumn<T>[]>();
  readonly rows = input<T[]>([]);
  /** Campo usado como identidade da linha. */
  readonly rowKey = input('id');
  readonly loading = input(false);
  readonly emptyTitle = input('Nada por aqui');
  readonly emptyDescription = input<string>();

  private readonly cells = contentChildren(VlCellDirective);
  private readonly defaultCell = viewChild.required<TemplateRef<VlCellContext<T>>>('defaultCell');

  readonly mobileColumns = computed(() => this.columns().filter((c) => !c.hideOnMobile));
  readonly skeletonRows = [0, 1, 2, 3, 4];

  private readonly templates = computed(() => {
    const map = new Map<string, TemplateRef<VlCellContext<T>>>();
    this.cells().forEach((c) => map.set(c.column(), c.template as TemplateRef<VlCellContext<T>>));
    return map;
  });

  templateFor(key: string): TemplateRef<VlCellContext<T>> {
    return this.templates().get(key) ?? this.defaultCell();
  }

  cellValue(row: T, column: VlColumn<T>): unknown {
    const value = column.cell ? column.cell(row) : (row as Record<string, unknown>)[column.key];
    return value ?? '';
  }

  alignClass(column: VlColumn<T>): string {
    const align = column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
    return `${align} ${column.class ?? ''}`;
  }

  columnByKey(key: string): VlColumn<T> | undefined {
    return this.columns().find((c) => c.key === key);
  }

  trackRow = (index: number, row: T): unknown => (row as Record<string, unknown>)[this.rowKey()] ?? index;
}
