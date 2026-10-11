import { Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClientsService, IUser } from '../../../../services/clients.service';
import { ConfirmService, ToastService, VlBadgeComponent, VlButtonComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlSkeletonComponent } from '../../../../ui';
import { ClientDashboardComponent } from '../../client/dashboard/dashboard.component';
import { AdminTransactionDrawerComponent } from '../shared/admin-transaction-drawer.component';
import { formatBrl } from '../../../../shared/format';

/** Página do cliente para o admin: a carteira como o cliente vê, mais as ações de gestão. */
@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, LucideAngularModule, VlButtonComponent, VlBadgeComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlSkeletonComponent, ClientDashboardComponent, AdminTransactionDrawerComponent],
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  /** Vem da rota (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly client = signal<IUser | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly busy = signal(false);
  private readonly dashboard = viewChild(ClientDashboardComponent);

  readonly txOpen = signal(false);
  readonly editOpen = signal(false);
  readonly editError = signal<string | null>(null);
  edit = { name: '', phone: '' };

  readonly saldo = computed(() => formatBrl(this.client()?.totalInvestido ?? 0));

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  load(id = this.id()): void {
    this.loading.set(true);
    this.clientsService.getClientById(id).subscribe({
      next: (c) => {
        this.client.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  onTransactionSaved(): void {
    this.load();
    this.dashboard()?.reload();
  }

  openEdit(): void {
    const c = this.client();
    if (!c) return;
    this.edit = { name: c.name, phone: c.phone ?? '' };
    this.editError.set(null);
    this.editOpen.set(true);
  }

  saveEdit(): void {
    const c = this.client();
    if (!c) return;
    if (!this.edit.name.trim()) {
      this.editError.set('Informe o nome.');
      return;
    }
    this.busy.set(true);
    this.clientsService.updateClient(c.id, { name: this.edit.name.trim(), phone: this.edit.phone.trim() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.editOpen.set(false);
        this.toast.success('Dados atualizados.');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        const msg = err.error?.message;
        this.editError.set(Array.isArray(msg) ? msg[0] : msg || 'Não foi possível salvar.');
      },
    });
  }

  async toggleStatus(): Promise<void> {
    const c = this.client();
    if (!c) return;
    const activate = c.status !== 'Ativo';
    const ok = await this.confirm.ask({
      title: activate ? `Ativar ${c.name}?` : `Inativar ${c.name}?`,
      message: activate ? 'O cliente volta a participar do rateio e a acessar a plataforma.' : 'O cliente deixa de receber rendimentos novos. O histórico é mantido.',
      confirmLabel: activate ? 'Ativar' : 'Inativar',
      danger: !activate,
    });
    if (!ok) return;
    this.busy.set(true);
    this.clientsService.updateClient(c.id, { status: activate ? 'Ativo' : 'Inativo' }).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(activate ? 'Cliente ativado.' : 'Cliente inativado.');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.error(err.error?.message || 'Não foi possível alterar o status.');
      },
    });
  }

  resendInvite(): void {
    const c = this.client();
    if (!c) return;
    this.busy.set(true);
    this.auth.resendInvite(c.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(`Convite reenviado para ${c.email}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.error(err.error?.message || 'Não foi possível reenviar o convite.');
      },
    });
  }
}
