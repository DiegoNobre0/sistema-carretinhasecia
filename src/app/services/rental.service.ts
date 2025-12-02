import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private apiUrl = 'http://localhost:3333/rentals'; // Backend Fastify

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
}