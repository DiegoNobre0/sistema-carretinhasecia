import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table'; 
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { TabViewModule } from 'primeng/tabview'; // <--- IMPORTANTE: Adicionado para as abas funcionarem

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    ButtonModule, 
    DialogModule, 
    InputTextModule, 
    TableModule,
    DropdownModule,
    InputMaskModule,
    TabViewModule // <--- Adicionado na lista de imports do Standalone
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  
  customers: any[] = [];
  
  // Controle de Modais
  displayModal = false;
  displayHistory = false;
  historyData: any = null;
  
  customerForm: FormGroup;
  
  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      type: ['PF', Validators.required],
      document: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      address: [''],
      // Campos Novos (Fotos)
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
    // Reseta o form para o padrão (PF)
    this.customerForm.reset({ type: 'PF' });
  }

  onSubmit() {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe({
        next: () => {
          this.displayModal = false;
          this.loadCustomers(); // Recarrega a lista
          alert('Cliente cadastrado com sucesso!');
        },
        error: (err) => alert('Erro ao criar cliente! Verifique CPF duplicado.')
      });
    }
  }

  // --- LÓGICA DE UPLOAD DE FOTO (BASE64) ---
  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Salva a string base64 no form control
        this.customerForm.patchValue({ [fieldName]: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  // --- LÓGICA DE ABAS (PF / PJ) ---
  onTabChange(event: any) {
    // Se for aba 0 é PF, aba 1 é PJ
    const type = event.index === 0 ? 'PF' : 'PJ';
    this.customerForm.patchValue({ type: type });
    // Limpa o documento ao trocar de aba para evitar máscara errada
    this.customerForm.patchValue({ document: '' });
  }

  // --- LÓGICA DE HISTÓRICO ---
  openHistory(customer: any) {
    this.customerService.getHistory(customer.id).subscribe({
      next: (data) => {
        this.historyData = data;
        this.displayHistory = true;
      },
      error: () => alert('Erro ao carregar histórico.')
    });
  }
}