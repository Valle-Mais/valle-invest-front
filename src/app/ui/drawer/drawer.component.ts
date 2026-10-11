import { Component, HostListener, input, model, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { VlButtonComponent } from '../button/button.component';

/**
 * Painel lateral para formulários de criação e edição.
 *
 * <vl-drawer [(open)]="panelOpen" title="Registrar operação">
 *   ...formulário...
 *   <div footer>...botões...</div>
 * </vl-drawer>
 */
@Component({
  selector: 'vl-drawer',
  standalone: true,
  imports: [LucideAngularModule, VlButtonComponent],
  templateUrl: './drawer.component.html',
})
export class VlDrawerComponent {
  readonly open = model(false);
  readonly title = input('');
  readonly closed = output<void>();

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
