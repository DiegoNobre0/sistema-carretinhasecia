import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Importações do PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TrailerService } from '../../services/trailer.service';
import { ImageCompressService } from 'src/app/services/image-compress.service';

@Component({
  selector: 'app-trailers',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './trailers.component.html',
  styleUrls: ['./trailers.component.scss']
})
export class TrailersComponent implements OnInit {
  
  trailers: any[] = [];
  displayModal: boolean = false;
  trailerForm: FormGroup;

  constructor(
    private trailerService: TrailerService,
    private fb: FormBuilder,
    private imageService: ImageCompressService
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
    this.trailerService.getTrailers().subscribe({
      next: (data) => {
        this.trailers = data;
        console.log('Carretinhas carregadas:', data);
      },
      error: (err) => console.error('Erro ao carregar carretinhas:', err)
    });
  }

  showDialog() {
    this.displayModal = true;
    this.trailerForm.reset();
  }

onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.type.match(/image.*/)) {
        alert('Selecione uma imagem válida.');
        return;
      }

      this.imageService.compressFile(file).then(result => {
        this.trailerForm.patchValue({ photoUrl: result });
      });
    }
  }

  onSubmit() {
    if (this.trailerForm.valid) {
      this.trailerService.createTrailer(this.trailerForm.value).subscribe({
        next: (res) => {
          console.log('Criado com sucesso!', res);
          this.displayModal = false;
          this.loadTrailers(); // Atualiza a lista
        },
        error: (err) => alert('Erro ao criar carretinha (verifique o console)')
      });
    }
  }
}