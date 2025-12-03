// frontend/src/app/services/trailer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class TrailerService { 

  private api = environment.apiUrl; 
  // Monta a rota específica
  private apiUrl = `${this.api}/trailers`;


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
  getAvailableTrailers(startDate: Date, endDate: Date): Observable<any[]> {
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  return this.http.get<any[]>(`${this.api}/trailers/available?startDate=${start}&endDate=${end}`);
}

// Adicione este método
getBusyDates(trailerId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.api}/trailers/${trailerId}/busy-dates`);
}

updateTrailer(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}