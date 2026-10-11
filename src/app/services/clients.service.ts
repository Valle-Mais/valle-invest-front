import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IUser {
  id: string;
  name: string;
  email: string;
  /** ISO */
  joinDate: string;
  status: 'Ativo' | 'Inativo';
  role: 'admin' | 'client';
  totalInvestido: number;
  participationPercent?: number;
  /** true enquanto o usuário não definiu senha (convite pendente). */
  mustSetPassword?: boolean;
  phone?: string;
}

/** Criação pelo admin. O aporte inicial vira transação aprovada na API. */
export interface CreateClientPayload {
  name: string;
  email: string;
  role: 'admin' | 'client';
  totalInvestido?: number;
  phone?: string;
}

/** O que o admin pode alterar depois. Email, papel e saldo não passam por aqui. */
export interface UpdateClientPayload {
  name?: string;
  phone?: string;
  status?: 'Ativo' | 'Inativo';
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  getClients(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.apiUrl).pipe(map((users) => users.map(normalizeDates)));
  }

  getClientById(id: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`).pipe(map(normalizeDates));
  }

  createClient(user: CreateClientPayload): Observable<IUser> {
    return this.http.post<IUser>(this.apiUrl, user);
  }

  updateClient(id: string, user: UpdateClientPayload): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/${id}`, user);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/** Alguns endpoints ainda devolvem Timestamp do Firestore em joinDate. */
function normalizeDates(user: IUser & { joinDate: unknown }): IUser {
  const raw = user.joinDate as { _seconds?: number } | string;
  if (raw && typeof raw === 'object' && typeof raw._seconds === 'number') {
    return { ...user, joinDate: new Date(raw._seconds * 1000).toISOString() };
  }
  return user as IUser;
}
