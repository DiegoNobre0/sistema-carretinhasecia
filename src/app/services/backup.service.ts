import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class BackupService {

 private api = environment.apiUrl; 
      // Monta a rota específica
    private apiUrl = `${this.api}/backup`;

 

  constructor(private http: HttpClient) {}

  downloadBackup() {
    // Pedimos a resposta como 'blob' (arquivo binário)
    return this.http.get(this.apiUrl, { responseType: 'blob' });
  }
}