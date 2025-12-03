import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class RentalService {

  private api = environment.apiUrl; 
  // Monta a rota específica
  private apiUrl = `${this.api}/rentals`;

  constructor(private http: HttpClient) {}

  // Listar todas as locações
  getRentals(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Criar nova locação
  createRental(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  returnRental(id: string, extraCosts: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/return`, { extraCosts });
}

updateExtraCosts(id: string, extraCosts: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/costs`, { extraCosts });
}
uploadContract(id: string, fileBase64: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/contract`, { fileBase64 });
}

deleteRental(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}

updateRental(id: string, data: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, data);
}
}