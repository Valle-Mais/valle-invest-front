// src/app/pages/public/landing/landing.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-landing',
  standalone: true,
  // Adicione ThemeToggleComponent e RouterLink às importações
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingPageComponent {
  // A lógica específica da landing page pode ser adicionada aqui no futuro.
}
