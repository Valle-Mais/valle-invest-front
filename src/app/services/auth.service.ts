import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser, ClientsService } from './clients.service';
import { Router } from '@angular/router';

interface ILoginResponse {
  access_token: string;
  user: IUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  // O estado do utilizador começa como `undefined` para indicar "a carregar"
  private currentUserSubject = new BehaviorSubject<IUser | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private clientsService: ClientsService // Injeta o serviço de clientes
  ) {
    // A lógica para carregar o utilizador logado é chamada aqui.
    this.loadUserFromBackend();
  }

  /**
   * Decodifica um token JWT para ler o seu payload sem validação.
   */
  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error("Não foi possível decodificar o token.", e);
      return null;
    }
  }

  /**
   * Carrega o utilizador logado:
   * 1. Pega o token do localStorage.
   * 2. Decodifica o token para obter o ID do utilizador (sub).
   * 3. Usa o ClientsService para chamar `GET /clients/:id` e obter os dados completos.
   */
  private loadUserFromBackend(): void {
    // CORREÇÃO: Utiliza a chave correta 'access_token'.
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.currentUserSubject.next(null); // Se não há token, não está logado.
      return;
    }

    const decodedPayload = this.decodeToken(token);
    // Verifica se o token é válido e não expirou
    if (!decodedPayload || decodedPayload.exp * 1000 < Date.now()) {
      this.logout();
      return;
    }

    const userId = decodedPayload.sub; // 'sub' (subject) é geralmente o ID do utilizador
    if (!userId) {
      console.error("Token não contém ID de utilizador (sub).");
      this.logout();
      return;
    }

    // Usa o ClientsService para chamar o endpoint /clients/:id
    this.clientsService.getClientById(userId).pipe(
      catchError(error => {
        console.error("Falha ao buscar utilizador do backend. A fazer logout.", error);
        this.logout();
        return of(null);
      })
    ).subscribe(user => {
      this.currentUserSubject.next(user); // Emite o utilizador ou nulo
    });
  }

  /**
   * Solicita ao backend que envie um link de login para o email fornecido.
   */
  requestLoginLink(email: string): Observable<void> {
    const origin = window.location.origin;
    return this.http.post<void>(`${this.apiUrl}/request-login-link`, { email, origin });
  }

  /**
   * Verifica o token de login. Se for bem-sucedido, armazena o token para
   * requisições futuras e atualiza o estado do utilizador em memória.
   */
  verifyLoginToken(token: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiUrl}/verify-login`, { token }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Termina a sessão do utilizador.
   */
  logout(): void {
    // CORREÇÃO: Utiliza a chave correta 'access_token'.
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Define a sessão do utilizador após um login bem-sucedido.
   */
  private setSession(authResponse: ILoginResponse): void {
    // CORREÇÃO: Utiliza a chave correta 'access_token'.
    localStorage.setItem('access_token', authResponse.access_token);
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Retorna o valor atual do utilizador logado.
   */
  public get currentUserValue(): IUser | null | undefined {
    return this.currentUserSubject.value;
  }
}
