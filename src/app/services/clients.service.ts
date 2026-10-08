import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface para o Cliente/Usuário
export interface IUser {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: 'Ativo' | 'Inativo';
  role: 'admin' | 'client';
  totalInvestido: number;
 participationPercent?: number; // Novo campo para a porcentagem da carteira
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private apiUrl = `${environment.apiUrl}/clients`; // Garanta que a rota está correta

  constructor(private http: HttpClient) { }

  getClients(): Observable<IUser[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => users.map(user => {
        if (user.joinDate && typeof user.joinDate === 'object' && user.joinDate._seconds) {
          return { ...user, joinDate: new Date(user.joinDate._seconds * 1000).toISOString() };
        }
        return user;
      }))
    );
  }

  /**
   * Busca um único cliente pelo seu ID.
   * Este método é necessário para o AuthService buscar os dados do usuário logado.
   * @param id O ID do cliente (geralmente o 'sub' do JWT).
   */
  getClientById(id: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`);
  }

  createClient(user: Partial<IUser>): Observable<IUser> {
    return this.http.post<IUser>(this.apiUrl, user);
  }

  updateClient(id: string, user: Partial<IUser>): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/${id}`, user);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
