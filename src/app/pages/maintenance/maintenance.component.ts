import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MaintenanceService } from '../../services/maintenance.service';
import { TrailerService } from '../../services/trailer.service';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DialogModule, TableModule, DropdownModule, 
    InputTextModule, InputNumberModule, InputTextareaModule
  ],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
  
  maintenances: any[] = [];
  availableTrailers: any[] = []; // Para mandar para oficina
  trailersInMaintenance: any[] = []; // Para liberar
  
  displayModal = false;
  maintenanceForm: FormGroup;
  totalCost = 0;

  constructor(
    private maintenanceService: MaintenanceService,
    private trailerService: TrailerService,
    private fb: FormBuilder
  ) {
    this.maintenanceForm = this.fb.group({
      trailerId: [null, Validators.required],
      description: ['', Validators.required],
      cost: [null, Validators.required],
      workshop: ['']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Carregar Histórico
    this.maintenanceService.getMaintenances().subscribe(data => {
      this.maintenances = data;
      // Calcula total gasto (KPI do PDF)
      this.totalCost = data.reduce((acc, curr) => acc + curr.cost, 0);
    });

    // 2. Carregar carretinhas para popular o Dropdown
    this.trailerService.getTrailers().subscribe(data => {
      // Dropdown de cadastro: Só as DISPONÍVEIS
      this.availableTrailers = data.filter(t => t.status === 'AVAILABLE');
      
      // Lista auxiliar: Carretinhas que JÁ ESTÃO em manutenção (para podermos liberar)
      this.trailersInMaintenance = data.filter(t => t.status === 'MAINTENANCE');
    });
  }

  showDialog() {
    this.displayModal = true;
    this.maintenanceForm.reset();
  }

  onSubmit() {
    if (this.maintenanceForm.valid) {
      this.maintenanceService.createMaintenance(this.maintenanceForm.value).subscribe({
        next: () => {
          this.displayModal = false;
          this.loadData(); // Atualiza tudo
          alert('Carretinha enviada para manutenção!');
        },
        error: (err) => alert('Erro: ' + (err.error?.error || 'Desconhecido'))
      });
    }
  }

  // Função para liberar (Botão na lista de carretinhas em manutenção, se quisermos mostrar)
  // Mas vamos simplificar e colocar apenas o histórico por enquanto.
}