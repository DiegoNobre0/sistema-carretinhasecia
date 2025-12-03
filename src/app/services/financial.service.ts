import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

getStatement(startDate?: string, endDate?: string): Observable<any> {
    let params = '';
    if (startDate && endDate) {
      params = `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any>(`${this.apiUrl}/financial/statement${params}`);
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/financial`, data);
  }

  updateTransaction(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/financial/${id}`, data);
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/financial/${id}`);
  }
}