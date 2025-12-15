import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class RentalService {

  private api = environment.apiUrl; 
  // Ex: http://localhost:3333/rentals
  private apiUrl = `${this.api}/rentals`;

  constructor(private http: HttpClient) {}

  getRentals(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createRental(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  returnRental(id: string, extraCosts: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/return`, { extraCosts });
  }

  updateExtraCosts(id: string, extraCosts: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/costs`, { extraCosts });
  }

  // --- CORRIGIDO (URL CERTA) ---
  uploadContract(rentalId: string, fileBase64: string) {
    // O backend espera { contractUrl: "..." }
    const payload = { contractUrl: fileBase64 }; 
    return this.http.patch(`${this.apiUrl}/${rentalId}/contract`, payload);
  }

  deleteRental(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateRental(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  finishRental(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/finish`, data);
  }

  // --- SUGESTÃO DE AJUSTE AQUI TAMBÉM ---
  uploadReturnTerm(id: string, fileBase64: string): Observable<any> {
    // Se o backend espera 'returnTermUrl', mude a chave abaixo:
    const payload = { returnTermUrl: fileBase64 };
    
    // Verifique se a rota no backend é '/upload-return' ou '/return-term'
    return this.http.patch(`${this.apiUrl}/${id}/upload-return`, payload);
  }

  startRental(id: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/start`, {});
}
}