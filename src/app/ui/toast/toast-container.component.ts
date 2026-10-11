import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService, VlToastKind } from './toast.service';
import { VlIconName } from '../icon/icons';

const ICONS: Record<VlToastKind, VlIconName> = {
  success: 'circle-check',
  error: 'circle-x',
  info: 'info',
  warning: 'triangle-alert',
};

const CLASSES: Record<VlToastKind, string> = {
  success: 'border-positive/30 text-positive',
  error: 'border-negative/30 text-negative',
  info: 'border-info/30 text-info',
  warning: 'border-warning/30 text-warning',
};

/** Renderiza os toasts do ToastService. Colocar uma vez, no AppComponent. */
@Component({
  selector: 'vl-toast-container',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed bottom-20 md:bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[70] flex flex-col gap-2" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="flex items-start gap-3 rounded-lg border bg-surface-raised px-4 py-3 shadow-lg" [class]="classFor(toast.kind)">
          <lucide-icon [name]="iconFor(toast.kind)" [size]="18" class="mt-0.5 shrink-0" />
          <p class="flex-1 text-sm text-text">{{ toast.message }}</p>
          <button type="button" (click)="toasts.dismiss(toast.id)" class="text-text-muted hover:text-text" aria-label="Fechar">
            <lucide-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class VlToastContainerComponent {
  readonly toasts = inject(ToastService);

  iconFor(kind: VlToastKind): VlIconName {
    return ICONS[kind];
  }

  classFor(kind: VlToastKind): string {
    return CLASSES[kind];
  }
}
