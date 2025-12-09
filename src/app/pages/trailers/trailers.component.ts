import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TrailerService } from '../../services/trailer.service';
import { ImageCompressService } from '../../services/image-compress.service'; // <--- IMPORTE O SERVIÇO

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
  
  allTrailers: any[] = [];
  filteredTrailers: any[] = [];
  searchTerm: string = '';

  displayModal = false;
  isEditMode = false;
  editingId: string | null = null;
  trailerForm: FormGroup;

  constructor(
    private trailerService: TrailerService,
    private imageService: ImageCompressService, // <--- INJETE AQUI
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
      this.filterList();
    });
  }

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

  onSubmit() {
    if (this.trailerForm.valid) {
      const val = this.trailerForm.value;

      if (this.isEditMode && this.editingId) {
        this.trailerService.updateTrailer(this.editingId, val).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadTrailers();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Dados salvos com sucesso!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar.' })
        });
      } else {
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

  // --- ATUALIZAÇÃO DA FOTO COM COMPRESSÃO ---
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.messageService.add({ severity: 'info', summary: 'Aguarde', detail: 'Comprimindo foto...' });
      
      try {
        // Chama o serviço para comprimir a imagem
        const compressedBase64 = await this.imageService.compressImage(file);
        
        // Salva a versão leve no formulário
        this.trailerForm.patchValue({ photoUrl: compressedBase64 });
        
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Foto carregada!' });
      } catch (error) {
        console.error(error);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao processar imagem.' });
      }
    }
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RENTED': return 'warning';
      case 'MAINTENANCE': return 'danger';
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