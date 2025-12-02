import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';
import { PdfService } from '../../services/pdf.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview'; // ADICIONADO PARA SEPARAR ABAS
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, TableModule, 
    DropdownModule, CalendarModule, InputNumberModule, 
    TagModule, TooltipModule, TabViewModule,ToastModule
  ],
  providers: [DatePipe],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  

  displayCostModal = false;
  editingRental: any = null;
  costInput: number = 0;
  // Listas Separadas
  activeRentals: any[] = [];
  closedRentals: any[] = [];

  selectedCustomerObj: any = null;
  selectedTrailerObj: any = null;
  
  customers: any[] = [];
  trailers: any[] = []; 

  displayModal = false;
  rentalForm: FormGroup;
  totalCalculado: number = 0;
  diasCalculados: number = 0;

  displayReturnModal = false;
  selectedRentalId: string | null = null;
  extraCostsInput: number = 0;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private trailerService: TrailerService,
    private pdfService: PdfService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.rentalForm = this.fb.group({
      customerId: [null, Validators.required],
      trailerId: [null, Validators.required],
      dates: [null, Validators.required],
      dailyRate: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
    this.rentalForm.valueChanges.subscribe(() => this.calculateTotal());
  }

  // FUNÇÕES PARA CUSTOS EXTRAS
  openCostDialog(rental: any) {
    this.editingRental = rental;
    this.costInput = rental.extraCosts || 0; // Carrega o valor atual
    this.displayCostModal = true;
  }

  onSaveCost() {
    if (this.editingRental) {
      this.rentalService.updateExtraCosts(this.editingRental.id, this.costInput).subscribe({
        next: () => {
          this.displayCostModal = false;
          this.loadData(); // Atualiza a tela
          alert('Custos atualizados com sucesso!');
        },
        error: () => alert('Erro ao atualizar custos.')
      });
    }
  }

  getBaseValue(rental: any): number {
    return rental.totalValue - (rental.extraCosts || 0);
  }

  loadData() {
    this.rentalService.getRentals().subscribe(data => {
      // Separa o que está rodando do que já acabou
      this.activeRentals = data.filter(r => r.status === 'OPEN');
      this.closedRentals = data.filter(r => r.status !== 'OPEN');
    });

    this.customerService.getCustomers().subscribe(data => this.customers = data);
    this.trailerService.getTrailers().subscribe(data => {
      this.trailers = data.filter(t => t.status === 'AVAILABLE');
    });
  }

  // --- LÓGICA DE STATUS VISUAL (ATRASADO / HOJE) ---
  getRentalStatus(rental: any): 'LATE' | 'TODAY' | 'OK' {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const expected = new Date(rental.expectedEndDate);
    expected.setHours(0,0,0,0);

    if (today.getTime() > expected.getTime()) return 'LATE'; // Atrasado
    if (today.getTime() === expected.getTime()) return 'TODAY'; // Devolve Hoje
    return 'OK'; // No prazo
  }

  // ... (Resto das funções: showDialog, calculateTotal, onSubmit, openReturnDialog, etc. mantém igual)
  // Vou reimprimir as funções curtas para garantir que o arquivo fique completo na sua mente:

  showDialog() {
    this.displayModal = true;
    this.rentalForm.reset();
    this.totalCalculado = 0;
  }

 calculateTotal() {
    const formVal = this.rentalForm.value;
    
    // 1. Atualiza Objetos para o Resumo (Busca nas listas)
    if (formVal.customerId) {
      this.selectedCustomerObj = this.customers.find(c => c.id === formVal.customerId);
    }
    if (formVal.trailerId) {
      this.selectedTrailerObj = this.trailers.find(t => t.id === formVal.trailerId);
    }

    // 2. Cálculo Matemático (Igual anterior)
    const dates = formVal.dates;
    const dailyRate = formVal.dailyRate;

    if (dates && dates[0] && dates[1] && dailyRate) {
      const start = dates[0];
      const end = dates[1];
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Mínimo 1 dia
      
      this.diasCalculados = diffDays;
      this.totalCalculado = diffDays * dailyRate;
    } else {
      this.totalCalculado = 0;
      this.diasCalculados = 0;
    }
  }


// NOVA FUNÇÃO: Gerar Documentos de Rascunho (Preview)
  generateDraftDoc(type: 'CONTRACT' | 'PROMISSORY') {
    if (!this.rentalForm.valid) return;

    // Monta um objeto temporário simulando uma locação real
    const draftData = {
      customer: this.selectedCustomerObj,
      trailer: this.selectedTrailerObj,
      startDate: this.rentalForm.value.dates[0],
      expectedEndDate: this.rentalForm.value.dates[1],
      totalValue: this.totalCalculado,
      dailyRate: this.rentalForm.value.dailyRate
    };

    if (type === 'CONTRACT') {
      this.pdfService.generateContract(draftData);
    } else {
      this.pdfService.generatePromissoryNote(draftData);
    }
  }

  onSubmit() {
    if (this.rentalForm.valid) {
      const val = this.rentalForm.value;
      const payload = {
        customerId: val.customerId,
        trailerId: val.trailerId,
        startDate: val.dates[0],
        expectedEndDate: val.dates[1],
        dailyRate: val.dailyRate
      };
    this.rentalService.createRental(payload).subscribe({
        next: () => {
          this.displayModal = false;
          this.loadData();
          
          // SUCESSO AO ALUGAR
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Locação Confirmada', 
            detail: 'Carretinha reservada com sucesso!' 
          });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Falha ao criar locação.' });
        }
      });
    }
  }

  openReturnDialog(rental: any) {
    this.selectedRentalId = rental.id;
    this.extraCostsInput = 0;
    this.displayReturnModal = true;
  }

 onConfirmReturn() {
    if (this.selectedRentalId) {
      this.rentalService.returnRental(this.selectedRentalId, this.extraCostsInput).subscribe({
        next: () => {
          this.displayReturnModal = false;
          this.loadData();
          
          // SUCESSO NA DEVOLUÇÃO
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Devolução Realizada', 
            detail: 'Carretinha liberada para novo uso.' 
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao finalizar locação.' })
      });
    }
  }

  generateContract(rental: any) {
    this.pdfService.generateContract(rental);
  }
}