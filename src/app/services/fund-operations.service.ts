// -------------------------------------------------------------------
// 1. Serviço de Operações do Fundo (sem alterações, para contexto)
// Arquivo: src/app/services/fund-operations.service.ts
// -------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IFundOperation {
  id?: string;
  data: string;
  descricao?: string;
  valorInvestido: number;
  valorVenda: number;
  resultado: number;
}

export interface FundOperationFilters {
  startDate?: string;
  endDate?: string;
  tipo?: 'Entrada' | 'Saída';
  valorMin?: number;
  valorMax?: number;
  sortBy?: 'data' | 'valor';
  sortOrder?: 'asc' | 'desc';
   page?: number;
  limit?: number;
}

export interface IPaginatedFundOperations {
    data: IFundOperation[];
    total: number;
}

@Injectable({
  providedIn: 'root'
})
export class FundOperationsService {
  private apiUrl = `${environment.apiUrl}/fund-operations`;

  constructor(private http: HttpClient) { }

    getFundOperations(filters: FundOperationFilters = {}): Observable<IPaginatedFundOperations> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.append(key, String(value));
      }
    });
    return this.http.get<IPaginatedFundOperations>(this.apiUrl, { params });
  }

  createFundOperation(operation: Omit<IFundOperation, 'id' | 'resultado'>): Observable<IFundOperation> {
    return this.http.post<IFundOperation>(this.apiUrl, operation);
  }

  updateFundOperation(id: string, updates: Partial<Omit<IFundOperation, 'id' | 'resultado'>>): Observable<IFundOperation> {
    return this.http.patch<IFundOperation>(`${this.apiUrl}/${id}`, updates);
  }

  deleteFundOperation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

