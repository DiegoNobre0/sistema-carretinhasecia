import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  // A URL base já é /users (PLURAL)
  private apiUrl = `${environment.apiUrl}/users`; 

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- CORREÇÃO AQUI ---
  createUser(data: any): Observable<any> {
    // Use this.apiUrl (que já é /users) OU escreva '/users' explicitamente
    return this.http.post(this.apiUrl, data);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}