import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Períodos aceitos pela API (enum curto). As strings legadas continuam valendo. */
export type PerformancePeriod = 'mes' | '6m' | 'ano' | 'inicio';

export interface IChartSeries {
  name: string;
  data: number[];
}

export interface IPerformanceYear {
  year: number;
  items: {
    label: 'Fundo' | 'CDI' | 'Ibovespa';
    monthlyValues: (number | null)[];
    annualTotal: number;
  }[];
}

/** Resposta de GET /performance/:clientId */
export interface IDashboardData {
  cardData: {
    saldoAtual: number;
    rendimentoReais: number;
    /** decimal: 0.242 = 24,2% */
    rentabilidadePercentual: number;
    /** razão: 1.11 = 111% do CDI */
    percentualSobreCDI: number;
    percentualSobreIbov: number;
  };
  chartData: {
    categories: string[];
    /** Rentabilidade acumulada em %: Minha Carteira, CDI, Ibovespa */
    series: IChartSeries[];
    /** Patrimônio em R$ ao fim de cada mês, mesmas categorias */
    seriesReais: IChartSeries[];
  };
  tableData: IPerformanceYear[];
}

/** Tipos usados pelo dashboard legado do admin (migra na Fase 4). */
export interface IKPIs {
  saldoLivre: number;
  saldoInvestido: number;
  lucroPercentual: number;
  totalOperacoes: number;
  usuariosAtivos: number;
}

export interface IRendimento {
  lucroReais: number;
  lucroPercentual: number;
  percentualSobreCDI: number;
}

export interface IChartData {
  series: { name: string; data: number[] }[];
  categories: string[];
}

export interface IAdminKpis {
  saldoLivre: number;
  saldoInvestido: number;
  patrimonioTotal: number;
  lucroPercentual: number;
  totalOperacoes: number;
  usuariosAtivos: number;
  /** Aportes menos resgates aprovados no mês corrente */
  fluxoLiquidoMes: number;
  pendentes: number;
}

export interface IDashboardSummary {
  kpis: IAdminKpis;
  rendimento: {
    lucroReais: number;
    lucroPercentual: number;
    percentualSobreCDI: number;
    percentualSobreIbov: number;
  };
  chartData: any;
}

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/performance`;

  getDashboardSummary(periodo: string): Observable<IDashboardSummary> {
    return this.http.get<IDashboardSummary>(`${this.apiUrl}/admin/summary`, { params: { periodo } });
  }

  getPerformanceDashboard(clientId: string, periodo: PerformancePeriod | string): Observable<IDashboardData> {
    return this.http.get<IDashboardData>(`${this.apiUrl}/${clientId}`, { params: { periodo } });
  }
}
