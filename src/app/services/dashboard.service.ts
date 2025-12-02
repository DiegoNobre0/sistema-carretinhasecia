import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {
    private api = environment.apiUrl; 
    // Monta a rota específica
    private apiUrl = `${this.api}/dashboard-metrics`;
 

  constructor(private http: HttpClient) {}

getMetrics(month?: number, year?: number): Observable<any> {
    // Garante que year tem valor
    const safeYear = year || new Date().getFullYear();
    
    let params = `?year=${safeYear}`;
    
    // Só adiciona month se for válido e diferente de null
    if (month !== null && month !== undefined) {
      params += `&month=${month}`;
    }
    
    return this.http.get<any>(`${this.apiUrl}${params}`);
  }
}