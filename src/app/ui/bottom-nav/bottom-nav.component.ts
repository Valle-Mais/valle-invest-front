import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { VlNavItem } from '../nav-item';

/** Navegação inferior, só em telas pequenas. Até 4 itens. */
@Component({
  selector: 'vl-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="fixed inset-x-0 bottom-0 z-30 md:hidden bg-surface-raised border-t border-border flex pb-[env(safe-area-inset-bottom)]" aria-label="Navegação principal">
      @for (item of items(); track item.link) {
        <a
          [routerLink]="item.link"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          class="relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          [class]="rla.isActive ? 'text-primary' : 'text-text-muted'"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <lucide-icon [name]="item.icon" [size]="20" />
          <span>{{ item.label }}</span>
          @if (item.badge) {
            <span class="absolute top-1.5 right-1/2 translate-x-4 min-w-4 h-4 px-1 rounded-full bg-accent text-primary-strong text-[10px] font-bold flex items-center justify-center">{{ item.badge }}</span>
          }
        </a>
      }
    </nav>
  `,
})
export class VlBottomNavComponent {
  readonly items = input.required<VlNavItem[]>();
}
