import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DropdownModule, InputTextModule, 
    InputNumberModule, CalendarModule, TagModule
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  
  agendaGroups: any[] = [];
  customers: any[] = [];
  trailers: any[] = [];
  
  // Variável que o HTML lê para bloquear os dias
  disabledDates: Date[] = [];

  // KPIs
  totalAgendado = 0;
  sinaisRecebidos = 0;
  proximaReserva: string = '--/--';

  reservationForm: FormGroup;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private trailerService: TrailerService,
    private fb: FormBuilder
  ) {
    this.reservationForm = this.fb.group({
      customerId: [null, Validators.required],
      trailerId: [null, Validators.required],
      signalValue: [0],
      dates: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.customerService.getCustomers().subscribe(data => this.customers = data);
    
    // Carrega TODAS as carretinhas (exceto manutenção)
    this.trailerService.getTrailers().subscribe(data => {
      this.trailers = data.filter(t => t.status !== 'MAINTENANCE');
    });

    this.rentalService.getRentals().subscribe(data => {
      const active = data.filter(r => r.status === 'OPEN' || r.status === 'RESERVED');
      this.calculateKPIs(active);
      this.groupRentalsByDate(active);
    });
  }

  // --- FUNÇÃO AUXILIAR: DATA SEGURA (CORRIGE FUSO HORÁRIO) ---
  // Transforma string ISO em Data Local correta (sem voltar 1 dia)
  parseDate(dateString: string): Date {
    const d = new Date(dateString);
    // Cria a data usando UTC para garantir que o dia 08 seja dia 08
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // --- LÓGICA DE DATAS OCUPADAS ---
  onTrailerSelect() {
    const trailerId = this.reservationForm.get('trailerId')?.value;
    
    // 1. Reseta para limpar o calendário
    this.disabledDates = [];
    this.reservationForm.patchValue({ dates: null });

    if (trailerId) {
      

      // Busca datas ocupadas no backend
      if (this.trailerService['getBusyDates']) {
         // @ts-ignore
         this.trailerService.getBusyDates(trailerId).subscribe(ranges => {
            let allDisabled: Date[] = [];
            
            ranges.forEach((range: any) => {
              // Usa a função segura para garantir o dia certo
              let current = this.parseDate(range.startDate);
              const end = this.parseDate(range.expectedEndDate);
              
             

              // Loop dia a dia
              while (current <= end) {
                allDisabled.push(new Date(current)); // Adiciona na lista
                current.setDate(current.getDate() + 1); // Próximo dia
              }
            });
            
            // ATRIBUIÇÃO IMPORTANTE: Cria um novo array para o Angular perceber a mudança
            this.disabledDates = [...allDisabled];
           
         });
      }
    }
  }

  calculateKPIs(rentals: any[]) {
    this.totalAgendado = rentals.length;
    this.sinaisRecebidos = rentals.reduce((acc, curr) => acc + (curr.signalValue || 0), 0);
    
    if (rentals.length > 0) {
      const sorted = [...rentals].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      this.proximaReserva = new Date(sorted[0].startDate).toLocaleDateString('pt-BR');
    }
  }

  groupRentalsByDate(rentals: any[]) {
    const groups: any = {};

    rentals.forEach(rental => {
      const dateKey = new Date(rental.startDate).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(rental.startDate),
          items: []
        };
      }
      groups[dateKey].items.push(rental);
    });

    this.agendaGroups = Object.values(groups).sort((a: any, b: any) => a.date - b.date);
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      const val = this.reservationForm.value;
      
      if (!val.dates || !val.dates[0] || !val.dates[1]) {
        alert('Selecione a data de retirada e devolução.');
        return;
      }

      const payload = {
        customerId: val.customerId,
        trailerId: val.trailerId,
        startDate: val.dates[0],
        expectedEndDate: val.dates[1],
        dailyRate: 100, 
        signalValue: val.signalValue
      };

      this.rentalService.createRental(payload).subscribe({
        next: () => {
          this.loadData();
          this.reservationForm.reset({ signalValue: 0 });
          this.disabledDates = [];
          alert('Reserva agendada com sucesso!');
        },
        error: (err) => alert('Erro ao agendar: ' + (err.error?.message || 'Verifique disponibilidade'))
      });
    }
  }
}