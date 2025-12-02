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
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar'; // Importante para Data de Nascimento
import { ImageCompressService } from 'src/app/services/image-compress.service';
import { MessageService } from 'primeng/api'; // <--- Importe
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule, 
    TableModule, DropdownModule, InputMaskModule,
    TabViewModule, CalendarModule,ToastModule
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  
  customers: any[] = [];
  displayModal = false;
  displayHistory = false;
  historyData: any = null;
  
  // CONTROLE DO MODAL DE DOCUMENTOS
  displayDocsModal = false;
  selectedCustomerDocs: any = null;

  // Controle de Edição
  isEditMode = false;
  selectedCustomerId: string | null = null;

  customerForm: FormGroup;
  
  // Controle visual dos arquivos selecionados
  fileNameCNH: string = '';
  fileNameProof: string = '';

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private imageService: ImageCompressService,
    private messageService: MessageService
  ) {
    this.customerForm = this.fb.group({
      // DADOS PESSOAIS
      name: ['', Validators.required],
      type: ['PF', Validators.required],
      document: ['', Validators.required],
      birthDate: [null], // Novo
      cnhNumber: [''],   // Novo
      phone: ['', Validators.required],
      email: [''],
      
      // ENDEREÇO (Campos visuais)
      zipCode: [''],
      street: [''],
      number: [''],
      district: [''],
      city: [''],

      // ARQUIVOS
      cnhUrl: [''],
      proofUrl: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }


showDialog() {
    this.displayModal = true;
    this.isEditMode = false; // Modo Criação
    this.selectedCustomerId = null;
    this.customerForm.reset({ type: 'PF' });
    this.fileNameCNH = '';
    this.fileNameProof = '';
  }


  loadCustomers() {
    this.customerService.getCustomers().subscribe(data => this.customers = data);
  }


  // FUNÇÃO PARA ABRIR OS DOCUMENTOS
  viewDocuments(customer: any) {
    this.selectedCustomerDocs = customer;
    
    // Verifica se tem pelo menos um documento para não abrir vazio
    if (!customer.cnhUrl && !customer.proofUrl) {
      alert('Este cliente não possui documentos anexados.');
      return;
    }
    
    this.displayDocsModal = true;
  }

  // NOVA FUNÇÃO: Preparar Edição
  editCustomer(customer: any) {
    this.displayModal = true;
    this.isEditMode = true; // Modo Edição
    this.selectedCustomerId = customer.id;

    // Preenche o formulário com os dados atuais
    this.customerForm.patchValue({
      name: customer.name,
      type: customer.type,
      document: customer.document,
      phone: customer.phone,
      email: customer.email,
      // Se tiver endereço junto, precisaria separar, mas por simplicidade vamos jogar no campo 'street' ou 'address'
      // O ideal no update é mandar o endereço completo de novo
      street: customer.address, 
      cnhUrl: customer.cnhUrl,
      proofUrl: customer.proofUrl
    });

    // Mostra feedback visual se já tiver foto
    if (customer.cnhUrl) this.fileNameCNH = 'Foto Atual Carregada';
    if (customer.proofUrl) this.fileNameProof = 'Foto Atual Carregada';
  }

onSubmit() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;

      // TRUQUE: Juntar os campos de endereço numa string só para o Backend
      // Formato: "Rua X, 123 - Bairro - Cidade - CEP"
      // Usamos || '' para evitar "undefined" se o campo estiver vazio
      const fullAddress = `${formValue.street || ''}, ${formValue.number || ''} - ${formValue.district || ''} - ${formValue.city || ''} - CEP: ${formValue.zipCode || ''}`;

      // Monta o objeto final
      const payload = {
        ...formValue,
        address: fullAddress // Substitui os campos separados pelo stringão
      };

      // DECISÃO: É EDIÇÃO OU CRIAÇÃO?
      if (this.isEditMode && this.selectedCustomerId) {
        
        // --- MODO EDIÇÃO (UPDATE) ---
        this.customerService.updateCustomer(this.selectedCustomerId, payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadCustomers();
            
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Atualizado', 
              detail: 'Dados do cliente alterados com sucesso!',
              life: 3000 
            });
          },
          error: (err) => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Erro na Edição', 
              detail: 'Falha ao atualizar os dados. Tente novamente.',
              life: 5000
            });
          }
        });

      } else {
        
        // --- MODO CRIAÇÃO (CREATE) ---
        this.customerService.createCustomer(payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadCustomers();
            
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Sucesso', 
              detail: 'Cliente cadastrado corretamente!',
              life: 3000 
            });
          },
          error: (err) => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Erro no Cadastro', 
              detail: 'Não foi possível salvar. Verifique se o CPF já existe.',
              life: 5000
            });
          }
        });
      }

    } else {
      // ALERTA DE AVISO (Campos inválidos)
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atenção', 
        detail: 'Preencha todos os campos obrigatórios antes de salvar.' 
      });
    }    
  }

onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    
    if (file) {
      // Verifica se é imagem
      if (!file.type.match(/image.*/)) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Atualiza nome visualmente
      if (fieldName === 'cnhUrl') this.fileNameCNH = file.name;
      if (fieldName === 'proofUrl') this.fileNameProof = file.name;

      // CHAMA A COMPRESSÃO
      this.imageService.compressFile(file).then(compressedBase64 => {
        // Agora 'compressedBase64' é bem leve!
        this.customerForm.patchValue({ [fieldName]: compressedBase64 });
      }).catch(err => {
        console.error('Erro ao comprimir imagem', err);
      });
    }
  }

  onTabChange(event: any) {
    const type = event.index === 0 ? 'PF' : 'PJ';
    this.customerForm.patchValue({ type: type });
    this.customerForm.patchValue({ document: '' });
  }

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