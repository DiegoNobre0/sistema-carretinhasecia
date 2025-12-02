import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3333/dashboard-metrics';

  constructor(private http: HttpClient) {}

getMetrics(month?: number, year?: number): Observable<any> {
  let params = `?year=${year || new Date().getFullYear()}`;
  if (month) params += `&month=${month}`;
  
  return this.http.get<any>(`${this.apiUrl}${params}`);
}
}