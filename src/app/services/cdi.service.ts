import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { formatDate } from '@angular/common';

// Interface para a resposta da API do BCB
export interface CdiItem {
  data: string;
  valor: string;
}

// Interface para os retornos mensais que vamos calcular
export interface MonthlyReturn {
  year: number;
  month: number; // 0 = Janeiro, 11 = Dezembro
  returnValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class CdiService {
  private baseUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados';

  constructor(private http: HttpClient) { }

  /**
   * Busca os dados diários do CDI desde uma data inicial e os converte para retornos mensais.
   */
  getMonthlyCDIReturns(startDate: Date): Observable<MonthlyReturn[]> {
    // A API do BCB usa o formato dd/MM/yyyy
    const formattedDate = formatDate(startDate, 'dd/MM/yyyy', 'en-US');
    const url = `${this.baseUrl}?dataInicial=${formattedDate}&formato=json`;

    return this.http.get<CdiItem[]>(url).pipe(
      map(dailyData => this.calculateMonthlyReturns(dailyData))
    );
  }

  /**
   * Converte uma lista de retornos diários em uma lista de retornos mensais.
   * A rentabilidade mensal é o produto dos fatores diários, não a soma.
   */
  private calculateMonthlyReturns(dailyData: CdiItem[]): MonthlyReturn[] {
    const monthlyGroups: { [key: string]: number[] } = {};

    // 1. Agrupa os valores diários por mês/ano
    dailyData.forEach(item => {
      // Formato da API: "dd/MM/yyyy"
      const [day, month, year] = item.data.split('/');
      const key = `${year}-${month}`;
      const dailyValue = parseFloat(item.valor);

      if (!isNaN(dailyValue)) {
        if (!monthlyGroups[key]) {
          monthlyGroups[key] = [];
        }
        monthlyGroups[key].push(dailyValue);
      }
    });

    // 2. Calcula o retorno composto para cada mês
    const monthlyReturns: MonthlyReturn[] = [];
    for (const key in monthlyGroups) {
      const dailyRates = monthlyGroups[key];

      // Fórmula do retorno composto: (1 + r1) * (1 + r2) * ... - 1
      const monthlyFactor = dailyRates.reduce((acc, rate) => acc * (1 + rate / 100), 1);
      const totalReturn = (monthlyFactor - 1) * 100;

      const [year, month] = key.split('-');
      monthlyReturns.push({
        year: parseInt(year, 10),
        month: parseInt(month, 10) - 1, // Converte para base 0 (Jan = 0)
        returnValue: totalReturn
      });
    }

    return monthlyReturns;
  }
}
