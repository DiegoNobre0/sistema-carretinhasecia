import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // <--- Importe isso

import { CustomerService } from '../../services/customer.service';
import { ImageCompressService } from '../../services/image-compress.service'; // Se estiver usando

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table'; 
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule, 
    TableModule, DropdownModule, InputMaskModule,
    TabViewModule, CalendarModule, ToastModule, TooltipModule
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  
  customers: any[] = [];
  
  // Modais
  displayModal = false;
  displayHistory = false;
  displayDocsModal = false;
  
  // NOVO: Modal de Contrato no Histórico
  displayContractModal = false;
  sanitizedContractUrl: SafeResourceUrl | null = null;

  historyData: any = null;
  selectedCustomerDocs: any = null;
  
  // Edição
  isEditMode = false;
  selectedCustomerId: string | null = null;
  
  customerForm: FormGroup;
  
  fileNameCNH: string = '';
  fileNameProof: string = '';

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private sanitizer: DomSanitizer // <--- Injete aqui
    // private imageService: ImageCompressService (se tiver usando)
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      type: ['PF', Validators.required],
      document: ['', Validators.required],
      birthDate: [null],
      cnhNumber: [''],
      phone: ['', Validators.required],
      email: [''],
      zipCode: [''],
      street: [''],
      number: [''],
      district: [''],
      city: [''],
      cnhUrl: [''],
      proofUrl: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe(data => this.customers = data);
  }

  showDialog() {
    this.displayModal = true;
    this.isEditMode = false;
    this.selectedCustomerId = null;
    this.customerForm.reset({ type: 'PF' });
    this.fileNameCNH = '';
    this.fileNameProof = '';
  }

  editCustomer(customer: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.selectedCustomerId = customer.id;

    // Tenta separar endereço (simplificado)
    const addressParts = (customer.address || '').split(' - ');
    // Ex: "Rua X, 123 - Bairro - Cidade - CEP: 000"
    // Lógica simples para preencher visualmente, o ideal é salvar separado no banco futuramente
    
    this.customerForm.patchValue({
      name: customer.name,
      type: customer.type,
      document: customer.document,
      phone: customer.phone,
      email: customer.email,
      street: customer.address, // Joga tudo aqui por enquanto
      cnhUrl: customer.cnhUrl,
      proofUrl: customer.proofUrl
    });

    if (customer.cnhUrl) this.fileNameCNH = 'Foto Atual Carregada';
    if (customer.proofUrl) this.fileNameProof = 'Foto Atual Carregada';
  }

  onSubmit() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
      const fullAddress = `${formValue.street || ''}, ${formValue.number || ''} - ${formValue.district || ''} - ${formValue.city || ''}`;

      const payload = { ...formValue, address: fullAddress };

      if (this.isEditMode && this.selectedCustomerId) {
        this.customerService.updateCustomer(this.selectedCustomerId, payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadCustomers();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Cliente salvo!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar.' })
        });
      } else {
        this.customerService.createCustomer(payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadCustomers();
            this.messageService.add({ severity: 'success', summary: 'Criado', detail: 'Cliente salvo!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar.' })
        });
      }
    }
  }

  // --- ARQUIVOS E FOTOS ---
  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      if (fieldName === 'cnhUrl') this.fileNameCNH = file.name;
      if (fieldName === 'proofUrl') this.fileNameProof = file.name;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.customerForm.patchValue({ [fieldName]: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  // --- ABAS ---
  onTabChange(event: any) {
    const type = event.index === 0 ? 'PF' : 'PJ';
    this.customerForm.patchValue({ type: type });
  }

  // --- VISUALIZADORES ---
  
  // 1. Documentos do Cliente (CNH/Comprovante)
  viewDocuments(customer: any) {
    this.selectedCustomerDocs = customer;
    if (!customer.cnhUrl && !customer.proofUrl) {
      this.messageService.add({ severity: 'warn', summary: 'Vazio', detail: 'Nenhum documento anexado.' });
      return;
    }
    this.displayDocsModal = true;
  }

  // 2. Histórico
  openHistory(customer: any) {
    this.customerService.getHistory(customer.id).subscribe({
      next: (data) => {
        this.historyData = data;
        this.displayHistory = true;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar histórico.' })
    });
  }

  // 3. NOVO: Ver Contrato Assinado (PDF) dentro do Histórico
  viewContract(rental: any) {
    if (rental.contractUrl) {
      this.sanitizedContractUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rental.contractUrl);
      this.displayContractModal = true;
    } else {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Nenhum contrato assinado para esta locação.' });
    }
  }
}