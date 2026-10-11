import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, shareReplay, startWith, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export type TransactionType = 'Aporte' | 'Resgate' | 'Rendimento';
export type TransactionStatus = 'Pendente' | 'Aprovado' | 'Negado';

export interface IClientTransaction {
  id: string;
  /** ISO */
  data: string;
  clientName: string;
  clientId: string;
  tipo: TransactionType;
  valor: number;
  status: TransactionStatus;
  operationId?: string;
  /** Saldo após a transação, calculado pela API em listagens por cliente (só aprovadas). */
  saldoApos?: number | null;
  /** Operação do fundo que gerou o rendimento, quando pedido com include=operation. */
  operation?: { id: string; descricao: string; data: string } | null;
}

export interface TransactionFilters {
  startDate?: string | null;
  endDate?: string | null;
  clientId?: string | null;
  status?: TransactionStatus | null;
  include?: 'operation' | null;
}

/** Payload de criação. O status é decidido pelo endpoint; clientId é ignorado em /request. */
export interface CreateTransactionPayload {
  data: string;
  tipo: TransactionType;
  valor: number;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientTransactionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/client-transactions`;
  private readonly refreshPendingCount$ = new Subject<void>();

  notifyPendingRequestsChange(): void {
    this.refreshPendingCount$.next();
  }

  getPendingCount(): Observable<{ count: number }> {
    return this.refreshPendingCount$.pipe(
      startWith(undefined),
      switchMap(() => this.http.get<{ count: number }>(`${this.apiUrl}/pending/count`)),
      shareReplay(1),
    );
  }

  getClientTransactions(filters: TransactionFilters = {}): Observable<IClientTransaction[]> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.clientId) params = params.set('clientId', filters.clientId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.include) params = params.set('include', filters.include);
    return this.http.get<IClientTransaction[]>(this.apiUrl, { params });
  }

  /** Admin registra uma transação já aprovada. */
  createClientTransaction(transaction: CreateTransactionPayload): Observable<IClientTransaction> {
    return this.http.post<IClientTransaction>(this.apiUrl, transaction);
  }

  /** Cliente solicita aporte ou resgate; entra como Pendente em nome do usuário do token. */
  createRequest(request: CreateTransactionPayload): Observable<IClientTransaction> {
    return this.http.post<IClientTransaction>(`${this.apiUrl}/request`, request);
  }

  updateClientTransaction(id: string, updates: Partial<Pick<IClientTransaction, 'data' | 'tipo' | 'valor' | 'status' | 'clientId'>>): Observable<IClientTransaction> {
    return this.http.patch<IClientTransaction>(`${this.apiUrl}/${id}`, updates);
  }

  deleteClientTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
