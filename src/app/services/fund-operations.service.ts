import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IFundOperation {
  id?: string;
  /** ISO */
  data: string;
  descricao?: string;
  valorInvestido: number;
  valorVenda: number;
  resultado: number;
}

export interface FundOperationFilters {
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: 'data' | 'valor';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IPaginatedFundOperations {
  data: IFundOperation[];
  total: number;
}

export interface IFundOperationPreview {
  patrimonioBase: number;
  taxa: number;
  clientes: { clientId: string; name: string; saldo: number; lucro: number; novoSaldo: number }[];
}

export type FundOperationPayload = {
  data: string;
  descricao?: string;
  valorInvestido?: number | null;
  valorVenda?: number | null;
  resultado?: number | null;
};

@Injectable({ providedIn: 'root' })
export class FundOperationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/fund-operations`;

  getFundOperations(filters: FundOperationFilters = {}): Observable<IPaginatedFundOperations> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<IPaginatedFundOperations>(this.apiUrl, { params });
  }

  /** Simula o rateio sem gravar. */
  preview(resultado: number, data?: string): Observable<IFundOperationPreview> {
    return this.http.post<IFundOperationPreview>(`${this.apiUrl}/preview`, { resultado, data });
  }

  createFundOperation(operation: FundOperationPayload): Observable<IFundOperation> {
    return this.http.post<IFundOperation>(this.apiUrl, clean(operation));
  }

  updateFundOperation(id: string, updates: Partial<FundOperationPayload>): Observable<IFundOperation> {
    return this.http.patch<IFundOperation>(`${this.apiUrl}/${id}`, clean(updates));
  }

  deleteFundOperation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/** Remove null/undefined: a API rejeita campos fora do DTO e null em campos numéricos. */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')) as Partial<T>;
}
