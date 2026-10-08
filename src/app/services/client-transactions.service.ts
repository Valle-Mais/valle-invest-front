import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, map, shareReplay, startWith, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface para as transações dos clientes
export interface IClientTransaction {
  id: string;
  data: string;
  clientName: string;
  clientId: string;
  tipo: 'Aporte' | 'Resgate' | 'Rendimento'; // Adicionado 'Rendimento'
  valor: number;
  status: 'Pendente' | 'Aprovado' | 'Negado';
  saldo?: number; // Saldo após a transação (calculado no frontend)

}


interface TransactionFilters {
  startDate?: string | null;
  endDate?: string | null;
   clientId?: string | null;

}

@Injectable({
  providedIn: 'root',
})
export class ClientTransactionsService {
  private apiUrl = `${environment.apiUrl}/client-transactions`; // Ajuste o URL da API se necessário
   private refreshPendingCount$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  notifyPendingRequestsChange(): void {
    this.refreshPendingCount$.next();
  }

   getPendingCount(): Observable<{ count: number }> {
    return this.refreshPendingCount$.pipe(
      // startWith(undefined) garante que a busca seja feita na primeira vez que alguém se inscreve
      startWith(undefined),
      // switchMap cancela a requisição anterior e faz uma nova
      switchMap(() => this.http.get<{ count: number }>(`${this.apiUrl}/pending/count`)),
      // shareReplay garante que todos os componentes que se inscreverem compartilhem o mesmo resultado
      shareReplay(1)
    );
  }

  /**
   * Busca todas as transações do backend.
   */
getClientTransactions(filters: TransactionFilters = {}): Observable<IClientTransaction[]> {
    let params = new HttpParams();

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    if (filters.clientId) {
      params = params.set('clientId', filters.clientId);
    }

    // A chamada HTTP agora envia os parâmetros
    return this.http.get<IClientTransaction[]>(this.apiUrl, { params });
  }

  /**
   * Cria uma nova transação.
   * @param transaction Os dados da nova transação.
   */
  createClientTransaction(
    transaction: Partial<IClientTransaction>
  ): Observable<IClientTransaction> {
    return this.http.post<IClientTransaction>(this.apiUrl, transaction);
  }

  /**
   * Cria uma nova solicitação de transação (com status Pendente).
   * @param request Os dados da nova solicitação.
   */
  createRequest(
    request: Partial<IClientTransaction>
  ): Observable<IClientTransaction> {
    return this.http.post<IClientTransaction>(
      `${this.apiUrl}/request`,
      request
    );
  }

  /**
   * Atualiza uma transação existente (ex: para aprovar/negar).
   * @param id O ID da transação a ser atualizada.
   * @param updates As atualizações a serem aplicadas.
   */
  updateClientTransaction(
    id: string,
    updates: Partial<IClientTransaction>
  ): Observable<IClientTransaction> {
    return this.http.patch<IClientTransaction>(`${this.apiUrl}/${id}`, updates);
  }

  deleteClientTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
