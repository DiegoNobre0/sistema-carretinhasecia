import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Services
import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';

// PrimeNG
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
  
  // Dados
  agendaGroups: any[] = []; // Lista agrupada por dia
  customers: any[] = [];
  trailers: any[] = [];
  
  // KPIs
  totalAgendado = 0;
  sinaisRecebidos = 0;
  proximaReserva: string = '--/--';

  // Formulário "Nova Reserva" (Lateral Esquerda)
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
      signalValue: [0], // Valor do Sinal
      date: [null, Validators.required] // Data da Reserva
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Carregar Clientes e Carretinhas para o Form
    this.customerService.getCustomers().subscribe(data => this.customers = data);
    this.trailerService.getTrailers().subscribe(data => this.trailers = data);

    // 2. Carregar Locações e Montar a Agenda
    this.rentalService.getRentals().subscribe(data => {
      // Filtra apenas futuras ou em aberto
      const active = data.filter(r => r.status === 'OPEN' || r.status === 'RESERVED');
      
      this.calculateKPIs(active);
      this.groupRentalsByDate(active);
    });
  }

  calculateKPIs(rentals: any[]) {
    this.totalAgendado = rentals.length;
    // Soma fictícia de sinais (ou campo real se tiver no banco)
    this.sinaisRecebidos = rentals.reduce((acc, curr) => acc + (curr.totalValue * 0.3), 0); // Ex: 30% sinal
    
    // Pega a data da próxima (a primeira da lista ordenada)
    if (rentals.length > 0) {
      const sorted = [...rentals].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      this.proximaReserva = new Date(sorted[0].startDate).toLocaleDateString('pt-BR');
    }
  }

  groupRentalsByDate(rentals: any[]) {
    const groups: any = {};

    rentals.forEach(rental => {
      const dateKey = new Date(rental.startDate).toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(rental.startDate),
          items: []
        };
      }
      groups[dateKey].items.push(rental);
    });

    // Ordena os grupos por data e converte para array
    this.agendaGroups = Object.values(groups).sort((a: any, b: any) => a.date - b.date);
  }

onSubmit() {
    // Validação extra: precisa ter as duas datas (Início e Fim)
    const dates = this.reservationForm.value.date;
    if (this.reservationForm.valid && dates && dates[0] && dates[1]) {
      
      const val = this.reservationForm.value;
      
      const payload = {
        customerId: val.customerId,
        trailerId: val.trailerId,
        startDate: dates[0],       // Primeira data selecionada
        expectedEndDate: dates[1], // Segunda data selecionada
        dailyRate: 100 // Valor padrão ou lógica de cálculo se quiser adicionar
      };

      this.rentalService.createRental(payload).subscribe({
        next: () => {
          this.loadData();
          this.reservationForm.reset({ signalValue: 0 });
          alert('Reserva agendada com sucesso!');
        },
        error: () => alert('Erro ao agendar. Verifique a disponibilidade.')
      });
    } else {
      alert('Por favor, selecione a data de retirada e devolução.');
    }
  }
}