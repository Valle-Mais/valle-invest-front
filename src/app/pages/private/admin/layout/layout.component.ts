import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ClientTransactionsService } from '../../../../services/client-transactions.service';
import { VlAppShellComponent, VlNavItem } from '../../../../ui';

/** Área do admin: só define o menu; a casca é o VlAppShell. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, VlAppShellComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly transactions = inject(ClientTransactionsService);

  private readonly pendingCount = toSignal(
    this.transactions.getPendingCount().pipe(map((r) => r.count)),
    { initialValue: 0 },
  );

  readonly navItems = computed<VlNavItem[]>(() => [
    { label: 'Dashboard', link: 'dashboard', icon: 'layout-dashboard', exact: true },
    { label: 'Clientes', link: 'clients', icon: 'users' },
    { label: 'Operações do fundo', link: 'fund-operations', icon: 'landmark' },
    { label: 'Aportes e resgates', link: 'client-transactions', icon: 'arrow-left-right', badge: this.pendingCount() },
  ]);

  readonly bottomNav = computed<VlNavItem[]>(() => this.navItems());
}
