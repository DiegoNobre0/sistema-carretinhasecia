import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = 'http://localhost:3333';

  constructor(private http: HttpClient) {}

  getStatement(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/financial/statement`);
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/financial`, data);
  }
}