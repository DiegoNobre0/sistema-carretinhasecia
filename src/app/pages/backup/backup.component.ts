import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackupService } from '../../services/backup.service';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent {
  
  loading = false;

  constructor(
    private backupService: BackupService,
    private messageService: MessageService
  ) {}

  onExport() {
    this.loading = true;
    this.backupService.downloadBackup().subscribe({
      next: (blob) => {
        // Truque para forçar o download no navegador
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `backup_sistema_${date}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Backup baixado com sucesso!' });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar backup.' });
      }
    });
  }
}