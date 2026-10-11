import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { VlConfirmDialogComponent, VlToastContainerComponent } from './ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VlToastContainerComponent, VlConfirmDialogComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Instanciar o serviço aplica a classe `dark` no <html> também nas telas públicas.
  private readonly theme = inject(ThemeService);
}
