import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = 'http://localhost:3333'; // Base URL

  constructor(private http: HttpClient) {}

  getMaintenances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/maintenances`);
  }

  createMaintenance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/maintenances`, data);
  }

  // Liberar carretinha da manutenção
  finishMaintenance(trailerId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/trailers/${trailerId}/finish-maintenance`, {});
  }
}