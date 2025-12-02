import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {

   private api = environment.apiUrl; 
      // Monta a rota específica
    private apiUrl = `${this.api}/customers`;
  

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getHistory(id: string): Observable<any> {
  // Chama a rota que criamos no Backend
  return this.http.get<any>(`${this.apiUrl}/${id}/history`);
}

updateCustomer(id: string, data: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, data);
}


}