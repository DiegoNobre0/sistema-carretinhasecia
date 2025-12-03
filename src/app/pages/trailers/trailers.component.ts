import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TrailerService } from '../../services/trailer.service';
import { ImageCompressService } from '../../services/image-compress.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-trailers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule, 
    ConfirmDialogModule, ToastModule, TagModule, TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './trailers.component.html',
  styleUrls: ['./trailers.component.scss']
})
export class TrailersComponent implements OnInit {
  
  allTrailers: any[] = []; // Lista completa
  filteredTrailers: any[] = []; // Lista filtrada pela busca
  searchTerm: string = '';

  displayModal = false;
  isEditMode = false;
  editingId: string | null = null;
  trailerForm: FormGroup;

  constructor(
    private trailerService: TrailerService,
    private imageService: ImageCompressService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.trailerForm = this.fb.group({
      plate: ['', Validators.required],
      model: ['', Validators.required],
      size: ['', Validators.required],
      photoUrl: ['']
    });
  }

  ngOnInit() {
    this.loadTrailers();
  }

  loadTrailers() {
    this.trailerService.getTrailers().subscribe(data => {
      this.allTrailers = data;
      this.filterList(); // Aplica o filtro se houver
    });
  }

  // --- FILTRO DE BUSCA ---
  filterList() {
    if (!this.searchTerm) {
      this.filteredTrailers = this.allTrailers;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTrailers = this.allTrailers.filter(t => 
        t.plate.toLowerCase().includes(term) || 
        t.model.toLowerCase().includes(term)
      );
    }
  }

  // --- MODAL (CRIAR / EDITAR) ---
  showDialog() {
    this.displayModal = true;
    this.isEditMode = false;
    this.editingId = null;
    this.trailerForm.reset();
  }

  editTrailer(trailer: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.editingId = trailer.id;
    
    this.trailerForm.patchValue({
      plate: trailer.plate,
      model: trailer.model,
      size: trailer.size,
      photoUrl: trailer.photoUrl
    });
  }

  // --- EXCLUIR ---
  deleteTrailer(event: Event, trailer: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir esta carretinha?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.trailerService.deleteTrailer(trailer.id).subscribe({
          next: () => {
            this.loadTrailers();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Carretinha excluída.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não é possível excluir carretinha em uso.' })
        });
      }
    });
  }

  // --- SALVAR ---
  onSubmit() {
    if (this.trailerForm.valid) {
      const val = this.trailerForm.value;

      if (this.isEditMode && this.editingId) {
        // UPDATE
        this.trailerService.updateTrailer(this.editingId, val).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadTrailers();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Dados salvos com sucesso!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar.' })
        });
      } else {
        // CREATE
        this.trailerService.createTrailer(val).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadTrailers();
            this.messageService.add({ severity: 'success', summary: 'Criado', detail: 'Carretinha cadastrada!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Placa já existe.' })
        });
      }
    }
  }

  // --- FOTO ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageService.compressFile(file).then(result => {
        this.trailerForm.patchValue({ photoUrl: result });
      });
    }
  }

  // Helper de Status
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'success'; // Verde
      case 'RENTED': return 'warning';    // Amarelo/Laranja
      case 'MAINTENANCE': return 'danger'; // Vermelho
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'DISPONÍVEL';
      case 'RENTED': return 'ALUGADA';
      case 'MAINTENANCE': return 'MANUTENÇÃO';
      default: return status;
    }
  }
}