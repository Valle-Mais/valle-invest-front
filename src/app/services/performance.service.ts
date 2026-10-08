// Arquivo: src/app/services/performance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// --- Interfaces para a Resposta da API ---
export interface IDashboardData {
  cardData: {
    saldoAtual: number;
    rendimentoReais: number;
    rentabilidadePercentual: number;
    percentualSobreCDI: number;
     percentualSobreIbov: number;
  };
  chartData: {
    categories: string[];
    series: any[];
  };
  tableData: any[];
}

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

// Resumo para o Dashboard do Cliente
export interface IClientDashboardSummary {
  saldoAtual: number;
  rendimentoReais: number;
  rentabilidadePercentual: number;
  percentualSobreCDI: number;
  chartData: IChartData;
}

export interface IDashboardSummary {
  kpis: any;
  rendimento: { // Garanta que a nova propriedade esteja aqui
    lucroReais: number;
    lucroPercentual: number;
    percentualSobreCDI: number;
    percentualSobreIbov: number; // NOVO
  };
  chartData: any;
}


@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private apiUrl = `${environment.apiUrl}/performance`;

  constructor(private http: HttpClient) { }

  getDashboardSummary(periodo: string): Observable<IDashboardSummary> {
    return this.http.get<IDashboardSummary>(`${this.apiUrl}/admin/summary`, {
      params: { periodo }
    });
  }

  // NOVO MÉTODO para o Dashboard do Cliente
  getClientDashboardSummary(clientId: string, period: string = 'Mês'): Observable<IClientDashboardSummary> {
    const params = new HttpParams().set('period', period);
    return this.http.get<IClientDashboardSummary>(`${this.apiUrl}/client/${clientId}`, { params });
  }

   getPerformanceDashboard(clientId: string, periodo: string): Observable<IDashboardData> {
    return this.http.get<IDashboardData>(`${this.apiUrl}/${clientId}`, {
      params: { periodo } // Envia 'periodo' como query param (ex: ?periodo=Ano)
    });
  }
}
