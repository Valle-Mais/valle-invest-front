import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface para o Instrumento (deve ser igual à do backend)
export interface IInstrument {
  id?: string;
  name: string;
  type: string; // Alterado para string
  description?: string; // Novo campo
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private apiUrl = `${environment.apiUrl}/instruments`;

  constructor(private http: HttpClient) { }

  getInstruments(): Observable<IInstrument[]> {
    return this.http.get<IInstrument[]>(this.apiUrl);
  }

  createInstrument(instrument: Omit<IInstrument, 'id'>): Observable<IInstrument> {
    return this.http.post<IInstrument>(this.apiUrl, instrument);
  }

  updateInstrument(id: string, instrument: Partial<IInstrument>): Observable<IInstrument> {
    return this.http.patch<IInstrument>(`${this.apiUrl}/${id}`, instrument);
  }

  deleteInstrument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
