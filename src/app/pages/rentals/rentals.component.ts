import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Services
import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';
import { PdfService } from '../../services/pdf.service'; // <--- 1. Importe o Service Novo

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, TableModule, 
    DropdownModule, CalendarModule, InputNumberModule, 
    TagModule, TooltipModule
  ],
  providers: [DatePipe],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  
  rentals: any[] = [];
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
    private pdfService: PdfService, // <--- 2. Injete o Service aqui
    private fb: FormBuilder
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

  loadData() {
    this.rentalService.getRentals().subscribe(data => this.rentals = data);
    this.customerService.getCustomers().subscribe(data => this.customers = data);
    this.trailerService.getTrailers().subscribe(data => {
      this.trailers = data.filter(t => t.status === 'AVAILABLE');
    });
  }

  showDialog() {
    this.displayModal = true;
    this.rentalForm.reset();
    this.totalCalculado = 0;
  }

  calculateTotal() {
    const dates = this.rentalForm.get('dates')?.value;
    const dailyRate = this.rentalForm.get('dailyRate')?.value;

    if (dates && dates[0] && dates[1] && dailyRate) {
      const start = dates[0];
      const end = dates[1];
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      this.diasCalculados = diffDays;
      this.totalCalculado = diffDays * dailyRate;
    } else {
      this.totalCalculado = 0;
    }
  }

  onSubmit() {
    if (this.rentalForm.valid) {
      const formValue = this.rentalForm.value;
      const payload = {
        customerId: formValue.customerId,
        trailerId: formValue.trailerId,
        startDate: formValue.dates[0],
        expectedEndDate: formValue.dates[1],
        dailyRate: formValue.dailyRate
      };

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
          alert('Locação finalizada!');
        },
        error: (err) => alert('Erro ao finalizar locação.')
      });
    }
  }

  // --- 3. FUNÇÃO SIMPLIFICADA USANDO O SERVICE ---
  generateContract(rental: any) {
    this.pdfService.generateContract(rental);
  }
}