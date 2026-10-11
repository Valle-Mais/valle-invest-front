import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClientsService, IUser } from '../../../../services/clients.service';
import { ConfirmService, ToastService, VlBadgeComponent, VlButtonComponent, VlCellDirective, VlColumn, VlDataTableComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlKpiCardComponent, VlPageHeaderComponent, VlPaginationComponent } from '../../../../ui';
import { formatBrl } from '../../../../shared/format';

const PAGE_SIZE = 10;

/** Lista de clientes com busca, convite e cadastro. O detalhe fica em /admin/clients/:id. */
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule, VlPageHeaderComponent, VlKpiCardComponent, VlDataTableComponent, VlCellDirective, VlPaginationComponent, VlBadgeComponent, VlButtonComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective],
  templateUrl: './clients.component.html',
})
export class ClientsComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly all = signal<IUser[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly page = signal(1);
  readonly busyId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.all().filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly rows = computed(() => this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE));

  readonly metrics = computed(() => {
    const clients = this.all().filter((u) => u.role === 'client');
    return {
      total: formatBrl(clients.reduce((s, u) => s + (u.totalInvestido || 0), 0)),
      ativos: String(clients.filter((u) => u.status === 'Ativo').length),
      convites: String(clients.filter((u) => u.mustSetPassword).length),
    };
  });

  readonly columns: VlColumn<IUser>[] = [
    { key: 'name', header: 'Cliente' },
    { key: 'joinDate', header: 'Desde', hideOnMobile: true, cell: (u) => new Date(u.joinDate).toLocaleDateString('pt-BR') },
    { key: 'totalInvestido', header: 'Saldo', align: 'right', class: 'num', cell: (u) => formatBrl(u.totalInvestido) },
    { key: 'participationPercent', header: 'Participação', align: 'right', class: 'num', hideOnMobile: true, cell: (u) => `${(u.participationPercent ?? 0).toFixed(1).replace('.', ',')}%` },
    { key: 'status', header: 'Status', align: 'center' },
    { key: 'acoes', header: '', align: 'right' },
  ];

  // Cadastro
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  form = { name: '', email: '', role: 'client' as 'client' | 'admin', totalInvestido: 0, phone: '' };

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.clientsService.getClients().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Não foi possível carregar os clientes.');
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  openCreate(): void {
    this.form = { name: '', email: '', role: 'client', totalInvestido: 0, phone: '' };
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      this.formError.set('Nome e email são obrigatórios.');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.clientsService
      .createClient({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        role: this.form.role,
        totalInvestido: Number(this.form.totalInvestido) || 0,
        ...(this.form.phone.trim() ? { phone: this.form.phone.trim() } : {}),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.drawerOpen.set(false);
          this.toast.success('Cliente criado. O convite para definir a senha foi enviado por email.');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const msg = err.error?.message;
          this.formError.set(Array.isArray(msg) ? msg[0] : msg || 'Não foi possível criar o cliente.');
        },
      });
  }

  resendInvite(user: IUser): void {
    this.busyId.set(user.id);
    this.auth.resendInvite(user.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(`Convite reenviado para ${user.email}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        this.toast.error(err.error?.message || 'Não foi possível reenviar o convite.');
      },
    });
  }

  async toggleStatus(user: IUser): Promise<void> {
    const activate = user.status !== 'Ativo';
    const ok = await this.confirm.ask({
      title: activate ? `Ativar ${user.name}?` : `Inativar ${user.name}?`,
      message: activate ? 'O cliente volta a participar do rateio e a acessar a plataforma.' : 'O cliente deixa de receber rendimentos novos. O histórico é mantido.',
      confirmLabel: activate ? 'Ativar' : 'Inativar',
      danger: !activate,
    });
    if (!ok) return;
    this.busyId.set(user.id);
    this.clientsService.updateClient(user.id, { status: activate ? 'Ativo' : 'Inativo' }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(activate ? 'Cliente ativado.' : 'Cliente inativado.');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        this.toast.error(err.error?.message || 'Não foi possível alterar o status.');
      },
    });
  }
}
