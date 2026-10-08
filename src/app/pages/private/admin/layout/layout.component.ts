// src/app/layouts/admin/layout/layout.component.ts

import { Component, OnInit, signal } from '@angular/core'; // Adicione OnInit
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../security/auth.service';
import { ClientTransactionsService } from '../../../../services/client-transactions.service'; // Importe o serviço
import { Observable, map, filter } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isMobileMenuOpen = signal(false);
  pendingCount$!: Observable<number>; // Observable para a contagem

  constructor(
    public authService: AuthService,
    private router: Router,
    private clientTransactionsService: ClientTransactionsService // Injete o serviço
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen.set(false);
    });
  }

  ngOnInit(): void {
    // Busca a contagem quando o componente é inicializado
    this.pendingCount$ = this.clientTransactionsService.getPendingCount().pipe(
      map(response => response.count)
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
