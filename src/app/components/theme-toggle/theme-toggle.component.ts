// src/app/components/theme-toggle/theme-toggle.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule], // Necessário para usar diretivas como *ngIf
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent {
  // Injeta o serviço de tema para aceder aos seus métodos e propriedades.
  // A propriedade é pública para que o template possa acedê-la.
  public themeService = inject(ThemeService);
}
