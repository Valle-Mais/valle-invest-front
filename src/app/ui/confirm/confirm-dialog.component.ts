import { Component, HostListener, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmService } from './confirm.service';
import { VlButtonComponent } from '../button/button.component';

/** Renderiza o diálogo do ConfirmService. Colocar uma vez, no AppComponent. */
@Component({
  selector: 'vl-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, VlButtonComponent],
  template: `
    @if (confirm.pending(); as dialog) {
      <div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50" (click)="confirm.answer(false)">
        <div
          class="w-full max-w-md rounded-2xl bg-surface-raised border border-border shadow-2xl p-6"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="dialog.title"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center"
                 [class]="dialog.danger ? 'bg-negative-soft text-negative' : 'bg-primary-soft text-primary'">
              <lucide-icon [name]="dialog.danger ? 'triangle-alert' : 'info'" [size]="20" />
            </div>
            <div class="min-w-0">
              <h2 class="font-sans text-lg font-bold text-text">{{ dialog.title }}</h2>
              @if (dialog.message) {
                <p class="mt-1 text-sm text-text-muted whitespace-pre-line">{{ dialog.message }}</p>
              }
            </div>
          </div>
          <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button vl-button variant="secondary" type="button" (click)="confirm.answer(false)">
              {{ dialog.cancelLabel || 'Cancelar' }}
            </button>
            <button vl-button [variant]="dialog.danger ? 'danger' : 'primary'" type="button" (click)="confirm.answer(true)">
              {{ dialog.confirmLabel || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class VlConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirm.pending()) this.confirm.answer(false);
  }
}
