import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMaintenances(startDate?: string, endDate?: string): Observable<any[]> {
    let params = '';
    if (startDate && endDate) {
      params = `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}/maintenances${params}`);
  }

  createMaintenance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/maintenances`, data);
  }

  // Liberar carretinha da manutenção
  finishMaintenance(trailerId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/trailers/${trailerId}/finish-maintenance`, {});
  }
  updateMaintenance(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/maintenances/${id}`, data);
  }

  // NOVO: Excluir
  deleteMaintenance(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/maintenances/${id}`);
  }
}