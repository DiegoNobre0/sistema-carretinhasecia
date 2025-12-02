import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = 'http://localhost:3333/backup';

  constructor(private http: HttpClient) {}

  downloadBackup() {
    // Pedimos a resposta como 'blob' (arquivo binário)
    return this.http.get(this.apiUrl, { responseType: 'blob' });
  }
}