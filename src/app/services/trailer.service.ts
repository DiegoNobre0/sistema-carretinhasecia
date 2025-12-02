// frontend/src/app/services/trailer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrailerService {
  // ATENÇÃO: Mudamos para a porta 3333 (padrão do backend Fastify que criamos)
  private apiUrl = 'http://localhost:3333/trailers';

  constructor(private http: HttpClient) {}

  getTrailers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTrailer(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
  
  deleteTrailer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}