import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services (Reutilizando os que já temos)
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';

// PrimeNG
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-senatran',
  standalone: true,
  imports: [
    CommonModule, FormsModule, 
    DropdownModule, ButtonModule, CardModule, TooltipModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './senatran.component.html',
  styleUrls: ['./senatran.component.scss']
})
export class SenatranComponent implements OnInit {
  
  customers: any[] = [];
  trailers: any[] = [];
  
  selectedCustomer: any = null;
  selectedTrailer: any = null;

  constructor(
    private customerService: CustomerService,
    private trailerService: TrailerService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Carregar dados para os Dropdowns
    this.customerService.getCustomers().subscribe(data => this.customers = data);
    this.trailerService.getTrailers().subscribe(data => this.trailers = data);
  }

  copyToClipboard(text: string, label: string) {
    if (!text) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Dado vazio ou não preenchido.' });
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado!', detail: `${label} copiado para a área de transferência.` });
    }).catch(err => {
      console.error('Erro ao copiar', err);
    });
  }

  openGovSite() {
    window.open('https://portalservicos.senatran.serpro.gov.br/', '_blank');
  }
}