import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = environment.apiUrl;

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