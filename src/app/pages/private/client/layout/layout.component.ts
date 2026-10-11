import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VlAppShellComponent, VlNavItem } from '../../../../ui';

/** Área do cliente: só define o menu; a casca é o VlAppShell. */
@Component({
  selector: 'app-client-area-layout',
  standalone: true,
  imports: [RouterOutlet, VlAppShellComponent],
  templateUrl: './layout.component.html',
})
export class ClientAreaLayoutComponent {
  readonly navItems: VlNavItem[] = [
    { label: 'Meu painel', link: 'dashboard', icon: 'layout-dashboard', exact: true },
    { label: 'Extrato', link: 'statement', icon: 'receipt-text' },
    { label: 'Solicitações', link: 'solicitacoes', icon: 'arrow-left-right' },
    { label: 'Perfil', link: 'perfil', icon: 'user' },
  ];

  readonly bottomNav: VlNavItem[] = [
    this.navItems[0],
    this.navItems[1],
    { label: 'Solicitar', link: 'solicitacoes', icon: 'arrow-left-right' },
    this.navItems[3],
  ];
}
