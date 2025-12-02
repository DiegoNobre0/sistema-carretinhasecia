import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MaintenanceService } from '../../services/maintenance.service';
import { TrailerService } from '../../services/trailer.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DropdownModule, InputTextModule, 
    InputNumberModule, CalendarModule
  ],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
  
  maintenances: any[] = [];
  availableTrailers: any[] = [];
  maintenanceForm: FormGroup;
  
  // KPIs
  totalCost = 0;
  totalServices = 0;
  averageCost = 0;

  constructor(
    private maintenanceService: MaintenanceService,
    private trailerService: TrailerService,
    private fb: FormBuilder
  ) {
    this.maintenanceForm = this.fb.group({
      trailerId: [null, Validators.required],
      description: ['', Validators.required],
      cost: [null, Validators.required],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Carregar Histórico e Calcular KPIs
    this.maintenanceService.getMaintenances().subscribe(data => {
      this.maintenances = data;
      
      // Cálculos Matemáticos
      this.totalServices = data.length;
      this.totalCost = data.reduce((acc, curr) => acc + curr.cost, 0);
      this.averageCost = this.totalServices > 0 ? (this.totalCost / this.totalServices) : 0;
    });

    // 2. Carregar Trailers Disponíveis
    this.trailerService.getTrailers().subscribe(data => {
      this.availableTrailers = data.filter(t => t.status === 'AVAILABLE');
    });
  }

  onSubmit() {
    if (this.maintenanceForm.valid) {
      this.maintenanceService.createMaintenance(this.maintenanceForm.value).subscribe({
        next: () => {
          this.loadData(); // Atualiza a lista e os KPIs
          this.maintenanceForm.reset({ date: new Date() }); // Limpa o form mantendo a data
          alert('Manutenção registrada!');
        },
        error: () => alert('Erro ao salvar.')
      });
    }
  }
}