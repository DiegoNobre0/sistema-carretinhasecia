import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MaintenanceService } from '../../services/maintenance.service';
import { TrailerService } from '../../services/trailer.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast'; // <--- Importado
import { TooltipModule } from 'primeng/tooltip';

// Services do PrimeNG
import { ConfirmationService, MessageService } from 'primeng/api'; // <--- Importado

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DropdownModule, InputTextModule, 
    InputNumberModule, CalendarModule, ConfirmDialogModule,
    ToastModule, TooltipModule
  ],
  providers: [ConfirmationService, MessageService], // <--- Injetado nos providers
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
  
  maintenances: any[] = [];
  availableTrailers: any[] = [];
  maintenanceForm: FormGroup;
  activeMaintenanceIds = new Set<string>();
  // KPIs
  totalCost = 0;
  totalServices = 0;
  averageCost = 0;

  // Filtro de Data
  dateFilter: Date[] | null = null;

  // Edição
  isEditMode = false;
  editingId: string | null = null;

  constructor(
    private maintenanceService: MaintenanceService,
    private trailerService: TrailerService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService // <--- ADICIONADO AQUI! (Correção do erro)
  ) {
    this.maintenanceForm = this.fb.group({
      trailerId: [null, Validators.required],
      description: ['', Validators.required],
      cost: [null, Validators.required],
      date: [new Date(), Validators.required],
      workshop: [null] 
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    let start = undefined;
    let end = undefined;

    if (this.dateFilter && this.dateFilter[0] && this.dateFilter[1]) {
      start = this.dateFilter[0].toISOString();
      end = this.dateFilter[1].toISOString();
    }

    this.maintenanceService.getMaintenances(start, end).subscribe(data => {
      this.maintenances = data;
      
      // KPIs
      this.totalServices = data.length;
      this.totalCost = data.reduce((acc, curr) => acc + curr.cost, 0);
      this.averageCost = this.totalServices > 0 ? (this.totalCost / this.totalServices) : 0;

      // CALCULA QUAIS SÃO AS ATIVAS (CORREÇÃO DO CADEADO)
      this.calculateActiveMaintenances();
    });

    this.trailerService.getTrailers().subscribe(data => {
      this.availableTrailers = data; 
    });
  }

  // --- NOVA FUNÇÃO: Descobre qual é a manutenção vigente ---
  calculateActiveMaintenances() {
    this.activeMaintenanceIds.clear();
    const processedTrailers = new Set<string>();

    // Como a lista já vem ordenada por Data (Mais recente primeiro) do Backend:
    // A primeira vez que encontrarmos uma carretinha com status MAINTENANCE, 
    // significa que aquele é o registro mais atual dela.
    
    this.maintenances.forEach(item => {
      if (item.trailer && item.trailer.status === 'MAINTENANCE') {
        // Se ainda não processamos essa carretinha, este é o registro mais recente
        if (!processedTrailers.has(item.trailerId)) {
          this.activeMaintenanceIds.add(item.id); // Marca este ID para ter cadeado
          processedTrailers.add(item.trailerId);  // Marca carretinha como processada
        }
      }
    });
  }

  showUnlockButton(item: any): boolean {
    return this.activeMaintenanceIds.has(item.id);
  }

  onFilterChange() {
    this.loadData();
  }

  clearFilter() {
    this.dateFilter = null;
    this.loadData();
  }

  editMaintenance(item: any) {
    this.isEditMode = true;
    this.editingId = item.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.maintenanceForm.patchValue({
      trailerId: item.trailerId,
      description: item.description,
      cost: item.cost,
      date: new Date(item.date),
      workshop: item.workshop
    });
  }

  deleteMaintenance(item: any) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este registro?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.maintenanceService.deleteMaintenance(item.id).subscribe({
          next: () => {
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro excluído!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir.' })
        });
      }
    });
  }

  // --- NOVA FUNÇÃO: LIBERAR CARRETINHA ---
  finishMaintenance(item: any) {
    if (item.trailer?.status !== 'MAINTENANCE') {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Esta carretinha já está liberada.' });
      return;
    }

    this.confirmationService.confirm({
      message: `O serviço na carretinha ${item.trailer.plate} foi concluído? Ela voltará a ficar DISPONÍVEL.`,
      header: 'Confirmar Liberação',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, Liberar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.maintenanceService.finishMaintenance(item.trailer.id).subscribe({
          next: () => {
            this.loadData(); 
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Carretinha liberada para locação!' });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar carretinha.' });
          }
        });
      }
    });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingId = null;
    this.maintenanceForm.reset({ date: new Date() });
  }

  onSubmit() {
    if (this.maintenanceForm.valid) {
      const val = this.maintenanceForm.value;

      if (this.isEditMode && this.editingId) {
        // ATUALIZAR
        this.maintenanceService.updateMaintenance(this.editingId, val).subscribe({
          next: () => {
            this.loadData();
            this.cancelEdit();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Salvo com sucesso!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar.' })
        });
      } else {
        // CRIAR
        this.maintenanceService.createMaintenance(val).subscribe({
          next: () => {
            this.loadData();
            this.maintenanceForm.reset({ date: new Date() });
            this.messageService.add({ severity: 'success', summary: 'Criado', detail: 'Manutenção registrada!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar.' })
        });
      }
    }
  }
}