import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  ConfirmService,
  ToastService,
  VlBadgeComponent,
  VlButtonComponent,
  VlCellDirective,
  VlColumn,
  VlDataTableComponent,
  VlDrawerComponent,
  VlEmptyStateComponent,
  VlFieldComponent,
  VlInputDirective,
  VlKpiCardComponent,
  VlLogoComponent,
  VlPageHeaderComponent,
  VlPaginationComponent,
  VlPeriodSelectorComponent,
  VlSkeletonComponent,
} from '../../../ui';

interface DemoRow {
  id: string;
  cliente: string;
  data: string;
  tipo: 'Aporte' | 'Resgate' | 'Rendimento';
  valor: number;
  status: 'Pendente' | 'Aprovado' | 'Negado';
}

/** Vitrine do design system. Só existe em desenvolvimento (/dev/ui). */
@Component({
  selector: 'app-ui-kit',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    VlBadgeComponent,
    VlButtonComponent,
    VlCellDirective,
    VlDataTableComponent,
    VlDrawerComponent,
    VlEmptyStateComponent,
    VlFieldComponent,
    VlInputDirective,
    VlKpiCardComponent,
    VlLogoComponent,
    VlPageHeaderComponent,
    VlPaginationComponent,
    VlPeriodSelectorComponent,
    VlSkeletonComponent,
  ],
  templateUrl: './ui-kit.component.html',
})
export class UiKitComponent {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly period = signal('Desde o início');
  readonly page = signal(1);
  readonly drawerOpen = signal(false);
  readonly loadingTable = signal(false);
  readonly saving = signal(false);
  email = '';

  readonly columns: VlColumn<DemoRow>[] = [
    { key: 'cliente', header: 'Cliente' },
    { key: 'data', header: 'Data', hideOnMobile: true },
    { key: 'tipo', header: 'Tipo' },
    { key: 'valor', header: 'Valor (R$)', align: 'right', class: 'num', cell: (r) => r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { key: 'status', header: 'Status', align: 'center' },
  ];

  readonly rows: DemoRow[] = [
    { id: '1', cliente: 'Maria Fernanda Alves', data: '03/10/2026', tipo: 'Aporte', valor: 25000, status: 'Pendente' },
    { id: '2', cliente: 'Ricardo Souza', data: '01/10/2026', tipo: 'Resgate', valor: 8000, status: 'Aprovado' },
    { id: '3', cliente: 'Ana Paula Ribeiro', data: '26/09/2026', tipo: 'Rendimento', valor: 3120.4, status: 'Aprovado' },
    { id: '4', cliente: 'João Pedro Martins', data: '22/09/2026', tipo: 'Aporte', valor: 15000, status: 'Negado' },
  ];

  statusTone(status: DemoRow['status']) {
    return status === 'Aprovado' ? 'positive' : status === 'Negado' ? 'negative' : 'warning';
  }

  tipoTone(tipo: DemoRow['tipo']) {
    return tipo === 'Resgate' ? 'negative' : tipo === 'Aporte' ? 'positive' : 'accent';
  }

  showToast(kind: 'success' | 'error' | 'info' | 'warning') {
    this.toast[kind](`Exemplo de toast de ${kind}.`);
  }

  async askConfirm(danger: boolean) {
    const ok = await this.confirm.ask({
      title: danger ? 'Excluir operação?' : 'Aprovar aporte de R$ 25.000,00?',
      message: danger ? 'Os rendimentos ligados a ela serão reprocessados.' : 'O saldo do cliente será recalculado pela API.',
      confirmLabel: danger ? 'Excluir' : 'Aprovar',
      danger,
    });
    this.toast.info(ok ? 'Confirmado.' : 'Cancelado.');
  }

  fakeSave() {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.drawerOpen.set(false);
      this.toast.success('Salvo com sucesso.');
    }, 900);
  }
}
