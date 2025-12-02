import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3333'; // Sua API Fastify

  constructor(private http: HttpClient, private router: Router) {}

  // Faz login e salva o token
  login(credentials: { email: string, password: string }) {
    return this.http.post<any>(`${this.apiUrl}/session`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user_name', response.name);
        localStorage.setItem('user_role', response.role);
      })
    );
  }

  // Faz logout e limpa tudo
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    this.router.navigate(['/login']);
  }

  // Verifica se está logado (para o Guard)
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'ADMIN';
  }

  // Pega o token (para o Interceptor)
  getToken() {
    return localStorage.getItem('token');
  }
}