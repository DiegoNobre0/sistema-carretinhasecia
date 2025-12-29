import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // <--- IMPORTANTE

import { TrailerService } from '../../services/trailer.service';
import { ImageCompressService } from '../../services/image-compress.service';
import { PdfCompressService } from '../../services/pdf-compress.service'; // <--- IMPORTANTE

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-trailers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule, InputNumberModule,
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

  // Variáveis para Documento e Visualização
  fileNameDoc: string = '';
  displayDocModal = false;
  sanitizedDocUrl: SafeResourceUrl | null = null;

  constructor(
    private trailerService: TrailerService,
    private imageService: ImageCompressService,
    private pdfService: PdfCompressService, // <--- INJETAR
    private sanitizer: DomSanitizer,        // <--- INJETAR
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.trailerForm = this.fb.group({
      plate: ['', Validators.required],
      model: ['', Validators.required],
      size: ['', Validators.required],
      color: ['Preta'],
      manufacturingYear: [new Date().getFullYear().toString()],
      modelYear: [new Date().getFullYear().toString()],
      capacity: [''],
      axles: [1],
      photoUrl: [''],
      documentUrl: [''] // <--- NOVO CAMPO
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
    this.fileNameDoc = ''; // Limpa nome do arquivo
    
    this.trailerForm.reset({
      color: 'Preta',
      axles: 1,
      manufacturingYear: new Date().getFullYear().toString(),
      modelYear: new Date().getFullYear().toString(),
      photoUrl: '',
      documentUrl: ''
    });
  }

  editTrailer(trailer: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.editingId = trailer.id;

    // Configura texto do botão de documento
    if (trailer.documentUrl) this.fileNameDoc = 'Documento Salvo (CRLV)';
    else this.fileNameDoc = '';
    
    this.trailerForm.patchValue({
      plate: trailer.plate,
      model: trailer.model,
      size: trailer.size,
      photoUrl: trailer.photoUrl,
      color: trailer.color,
      manufacturingYear: trailer.manufacturingYear,
      modelYear: trailer.modelYear,
      capacity: trailer.capacity,
      axles: trailer.axles,
      documentUrl: trailer.documentUrl // <--- PATCH
    });
  }

  // --- UPLOAD DA FOTO (Visual) ---
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.messageService.add({ severity: 'info', summary: 'Aguarde', detail: 'Processando foto...' });
      try {
        const compressedBase64 = await this.imageService.compressImage(file);
        this.trailerForm.patchValue({ photoUrl: compressedBase64 });
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Foto carregada!' });
      } catch (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na foto.' });
      }
    }
  }

  // --- UPLOAD DO DOCUMENTO (CRLV - PDF ou Imagem) ---
  async onDocumentSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.messageService.add({ severity: 'info', summary: 'Aguarde', detail: 'Processando documento...' });
      
      try {
        let resultBase64: string;

        // Verifica se é PDF ou Imagem
        if (file.type === 'application/pdf') {
             const pdfFile = await this.pdfService.compressPdf(file);
             resultBase64 = await this.fileToBase64(pdfFile);
        } else {
             resultBase64 = await this.imageService.compressImage(file);
        }

        this.trailerForm.patchValue({ documentUrl: resultBase64 });
        this.fileNameDoc = file.name;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento anexado!' });

      } catch (error) {
        console.error(error);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha no documento.' });
      }
    }
  }

  // Helper
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  }

  // --- VISUALIZAÇÃO ---
  viewDocument(trailer: any) {
    if (trailer.documentUrl) {
        // Sanitiza a URL para o Angular confiar nela dentro do <object> ou <iframe>
        this.sanitizedDocUrl = this.sanitizer.bypassSecurityTrustResourceUrl(trailer.documentUrl);
        this.displayDocModal = true;
    } else {
        this.messageService.add({severity:'warn', summary:'Aviso', detail:'Sem documento anexado.'});
    }
  }

  isPdf(url: string | null): boolean {
    if (!url) return false;
    // Verifica se é PDF pela string Base64 ou URL
    return url.includes('application/pdf') || url.toLowerCase().endsWith('.pdf') || url.startsWith('data:application/pdf');
  }

  // ... (Delete, Submit, GetStatus continuam iguais) ...
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
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Dados salvos!' });
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
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar.' })
        });
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