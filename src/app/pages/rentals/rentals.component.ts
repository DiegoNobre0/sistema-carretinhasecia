import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Services
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
import { TabViewModule } from 'primeng/tabview';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, TableModule, 
    DropdownModule, CalendarModule, InputNumberModule, 
    TagModule, TooltipModule, TabViewModule,ConfirmDialogModule
  ],
  providers: [DatePipe,ConfirmationService],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  
  // Listas
  activeRentals: any[] = [];
  closedRentals: any[] = [];
  futureRentals: any[] = [];

  // Variável para saber se estamos editando
  isEditMode = false;
  editingId: string | null = null;
  
  customers: any[] = [];
  trailers: any[] = []; 

  // Variável para bloquear datas no calendário (Dias Vermelhos)
  disabledDates: Date[] = []; 

  // Modais
  displayModal = false;
  rentalForm: FormGroup;
  totalCalculado: number = 0;
  diasCalculados: number = 0;

  displayReturnModal = false;
  selectedRentalId: string | null = null;
  extraCostsInput: number = 0;

  displayCostModal = false;
  editingRental: any = null;
  costInput: number = 0;

  displayContractModal = false;
  sanitizedContractUrl: SafeResourceUrl | null = null;

  // Resumo Visual
  selectedCustomerObj: any = null;
  selectedTrailerObj: any = null;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private trailerService: TrailerService,
    private pdfService: PdfService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService
  ) {
    this.rentalForm = this.fb.group({
      customerId: [null, Validators.required],
      trailerId: [null, Validators.required],
      dates: [null, Validators.required],
      dailyRate: [null, Validators.required],
      signalValue: [0]
    });
  }

  ngOnInit() {
    this.loadData();
    this.rentalForm.valueChanges.subscribe(() => this.calculateTotal());
  }

  loadData() {    
    this.rentalService.getRentals().subscribe(data => {
      this.activeRentals = data.filter(r => r.status === 'OPEN');
      this.closedRentals = data.filter(r => r.status === 'CLOSED' || r.status === 'CANCELED');
      this.futureRentals = data.filter(r => r.status === 'RESERVED');
    });

    this.customerService.getCustomers().subscribe(data => this.customers = data);
    
    // CARREGA TODAS AS CARRETINHAS (Para o Fluxo B)
    this.trailerService.getTrailers().subscribe(data => {
      this.trailers = data.filter(t => t.status !== 'MAINTENANCE');
    });
  }

  showDialog() {
    this.displayModal = true;
    this.isEditMode = false; // Modo Criação
    this.editingId = null;
    this.rentalForm.reset();
    this.totalCalculado = 0;
    this.selectedCustomerObj = null;
    this.selectedTrailerObj = null;
    this.disabledDates = []; // Limpa calendário
  }

  // --- LÓGICA DE DATAS OCUPADAS (FLUXO B) ---
  onTrailerSelect() {    
    const trailerId = this.rentalForm.get('trailerId')?.value;
    
    // Reseta
    this.disabledDates = [];
    this.rentalForm.patchValue({ dates: null }); 
    this.calculateTotal();

    if (trailerId) {
      // 1. Atualiza objeto visual
      this.selectedTrailerObj = this.trailers.find(t => t.id === trailerId);

      // 2. Busca datas ocupadas no backend
      if (this.trailerService['getBusyDates']) {
         // @ts-ignore
         this.trailerService.getBusyDates(trailerId).subscribe(ranges => {
            let allDisabled: Date[] = [];
            ranges.forEach((range: any) => {
              let current = new Date(range.startDate);
              const end = new Date(range.expectedEndDate);
              current.setHours(0,0,0,0);
              end.setHours(0,0,0,0);
              
              while (current <= end) {
                allDisabled.push(new Date(current));
                current.setDate(current.getDate() + 1);
              }
            });
            this.disabledDates = [...allDisabled];
         });
      }
    }
  }

  calculateTotal() {
    const formVal = this.rentalForm.value;
    
    if (formVal.customerId) {
      this.selectedCustomerObj = this.customers.find(c => c.id === formVal.customerId);
    }
    // Trailer já é atualizado no onTrailerSelect, mas garantimos aqui
    if (formVal.trailerId && !this.selectedTrailerObj) {
      this.selectedTrailerObj = this.trailers.find(t => t.id === formVal.trailerId);
    }

    const dates = formVal.dates;
    const dailyRate = formVal.dailyRate;

    if (dates && dates[0] && dates[1] && dailyRate) {
      const diff = Math.abs(dates[1].getTime() - dates[0].getTime());
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
      this.diasCalculados = days;
      this.totalCalculado = days * dailyRate;
    } else {
      this.totalCalculado = 0;
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
        dailyRate: val.dailyRate,
        signalValue: val.signalValue,
        totalValue: this.totalCalculado
      };


      if (this.isEditMode && this.editingId) {
        // UPDATE
        this.rentalService.updateRental(this.editingId, payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadData();
            alert('Locação atualizada!');
          },
          error: () => alert('Erro ao atualizar.')
        });
      } else {
       
      this.rentalService.createRental(payload).subscribe({
        next: () => {
          this.displayModal = false;
          this.loadData();
          alert('Locação realizada com sucesso!');
        },
        error: (err) => alert('Erro: ' + (err.error?.error || 'Erro desconhecido'))
      });
      }
    }    
  }

  // --- DOCUMENTOS ---
  onContractSelected(event: any, rental: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.rentalService.uploadContract(rental.id, e.target.result).subscribe({
          next: () => { this.loadData(); alert('Contrato anexado!'); },
          error: () => alert('Erro ao salvar.')
        });
      };
      reader.readAsDataURL(file);
    }
  }

  viewContract(rental: any) {
    if (rental.contractUrl) {
      this.sanitizedContractUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rental.contractUrl);
      this.displayContractModal = true;
    } else {
      alert('Nenhum contrato anexado.');
    }
  }

  // --- AÇÕES ---
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
          alert('Devolvido com sucesso!');
        },
        error: () => alert('Erro ao devolver.')
      });
    }
  }

  openCostDialog(rental: any) {
    this.editingRental = rental;
    this.costInput = rental.extraCosts || 0;
    this.displayCostModal = true;
  }

  onSaveCost() {
    if (this.editingRental) {
      this.rentalService.updateExtraCosts(this.editingRental.id, this.costInput).subscribe({
        next: () => {
          this.displayCostModal = false;
          this.loadData();
          alert('Custos atualizados!');
        },
        error: () => alert('Erro ao atualizar custos.')
      });
    }
  }

  // --- HELPERS ---
  getBaseValue(rental: any): number {
    return rental.totalValue - (rental.extraCosts || 0);
  }

  generateDraftDoc(type: 'CONTRACT' | 'PROMISSORY') {
    if (!this.rentalForm.valid) return;
    const draftData = {
      customer: this.selectedCustomerObj,
      trailer: this.selectedTrailerObj,
      startDate: this.rentalForm.value.dates[0],
      expectedEndDate: this.rentalForm.value.dates[1],
      totalValue: this.totalCalculado,
      dailyRate: this.rentalForm.value.dailyRate
    };
    if (type === 'CONTRACT') this.pdfService.generateContract(draftData);
    else this.pdfService.generatePromissoryNote(draftData);
  }

  generateContract(rental: any) {
    this.pdfService.generateContract(rental);
  }

  getRentalStatus(rental: any): 'LATE' | 'TODAY' | 'OK' {
    const today = new Date(); today.setHours(0,0,0,0);
    const expected = new Date(rental.expectedEndDate); expected.setHours(0,0,0,0);
    if (today.getTime() > expected.getTime()) return 'LATE';
    if (today.getTime() === expected.getTime()) return 'TODAY';
    return 'OK';
  }


  // === EXCLUIR ===
  confirmDelete(event: Event, rental: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir esta locação? A carretinha será liberada.',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.rentalService.deleteRental(rental.id).subscribe({
          next: () => {
            this.loadData();
            alert('Locação excluída!');
          },
          error: () => alert('Erro ao excluir.')
        });
      }
    });
  }

  // === EDITAR ===
  editRental(rental: any) {
    this.isEditMode = true;
    this.editingId = rental.id;
    this.displayModal = true;

    // Preenche o formulário
    this.rentalForm.patchValue({
      customerId: rental.customerId,
      // Nota: Trailer pode estar travado se a lógica de data limpar, 
      // então setamos a data primeiro
      dates: [new Date(rental.startDate), new Date(rental.expectedEndDate)],
      dailyRate: rental.dailyRate,
      signalValue: rental.signalValue,
      trailerId: rental.trailerId 
    });
    
    // Força o cálculo inicial e destrava o trailer
    this.rentalForm.get('trailerId')?.enable();
    this.calculateTotal();
    
    // Pequeno delay para garantir que o dropdown de trailers carregue o valor
    setTimeout(() => {
        this.rentalForm.patchValue({ trailerId: rental.trailerId });
    }, 100);
  }
}