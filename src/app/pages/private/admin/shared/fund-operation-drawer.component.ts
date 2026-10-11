import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { FundOperationsService, IFundOperation, IFundOperationPreview } from '../../../../services/fund-operations.service';
import { ToastService, VlButtonComponent, VlDrawerComponent, VlFieldComponent, VlInputDirective } from '../../../../ui';
import { formatBrl, formatPercent, signed, todayLocalIso } from '../../../../shared/format';

/**
 * Registrar ou editar uma operação do fundo. O resultado é calculado como
 * saída menos entrada enquanto o admin não o editar à mão. "Simular rateio"
 * mostra quanto cada cliente receberia antes de salvar.
 */
@Component({
  selector: 'app-fund-operation-drawer',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, VlDrawerComponent, VlFieldComponent, VlInputDirective, VlButtonComponent],
  templateUrl: './fund-operation-drawer.component.html',
})
export class FundOperationDrawerComponent {
  private readonly service = inject(FundOperationsService);
  private readonly toast = inject(ToastService);

  readonly open = model(false);
  /** Operação em edição; null para criar. */
  readonly operation = input<IFundOperation | null>(null);
  readonly saved = output<void>();

  data = todayLocalIso();
  descricao = '';
  valorInvestido: number | null = null;
  valorVenda: number | null = null;
  resultado: number | null = null;
  private resultadoManual = false;

  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly preview = signal<IFundOperationPreview | null>(null);
  readonly error = signal<string | null>(null);

  readonly isEdit = computed(() => !!this.operation());
  readonly title = computed(() => (this.isEdit() ? 'Editar operação' : 'Registrar operação'));
  readonly retroactive = computed(() => this.open() && this.data < todayLocalIso());

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const op = this.operation();
      this.error.set(null);
      this.preview.set(null);
      this.resultadoManual = !!op;
      if (op) {
        this.data = op.data.slice(0, 10);
        this.descricao = op.descricao ?? '';
        this.valorInvestido = op.valorInvestido ?? null;
        this.valorVenda = op.valorVenda ?? null;
        this.resultado = op.resultado ?? null;
      } else {
        this.data = todayLocalIso();
        this.descricao = '';
        this.valorInvestido = null;
        this.valorVenda = null;
        this.resultado = null;
      }
    });
  }

  onValuesChange(): void {
    if (this.resultadoManual) return;
    if (this.valorInvestido != null && this.valorVenda != null) {
      this.resultado = Math.round((Number(this.valorVenda) - Number(this.valorInvestido)) * 100) / 100;
    }
  }

  onResultadoInput(): void {
    this.resultadoManual = true;
  }

  simulate(): void {
    const resultado = Number(this.resultado);
    if (!resultado) {
      this.error.set('Informe o resultado para simular o rateio.');
      return;
    }
    this.previewing.set(true);
    this.error.set(null);
    this.service.preview(resultado, this.data).subscribe({
      next: (p) => {
        this.preview.set(p);
        this.previewing.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.previewing.set(false);
        this.error.set(err.error?.message || 'Não foi possível simular o rateio.');
      },
    });
  }

  save(): void {
    if (!this.data) {
      this.error.set('Informe a data da operação.');
      return;
    }
    const resultado = this.resultado == null || this.resultado === ('' as unknown) ? null : Number(this.resultado);
    if (resultado === null || Number.isNaN(resultado)) {
      this.error.set('Informe o resultado em reais (positivo ou negativo).');
      return;
    }

    const payload = {
      data: this.data,
      descricao: this.descricao.trim(),
      valorInvestido: this.valorInvestido != null ? Number(this.valorInvestido) : null,
      valorVenda: this.valorVenda != null ? Number(this.valorVenda) : null,
      resultado,
    };

    this.saving.set(true);
    this.error.set(null);
    const op = this.operation();
    const request$ = op?.id ? this.service.updateFundOperation(op.id, payload) : this.service.createFundOperation(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(op ? 'Operação atualizada e rendimentos reprocessados.' : 'Operação registrada e resultado distribuído.');
        this.open.set(false);
        this.saved.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = err.error?.message;
        this.error.set(Array.isArray(msg) ? msg[0] : msg || 'Não foi possível salvar a operação.');
      },
    });
  }

  fmt = formatBrl;
  fmtSigned = signed;
  fmtPct = formatPercent;
}
