import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { CustomerService } from '../../services/customer.service';
import { ImageCompressService } from '../../services/image-compress.service';
import { PdfCompressService } from '../../services/pdf-compress.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // <--- Importe aqui


// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table'; 
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule, 
    TableModule, DropdownModule, InputMaskModule,
    TabViewModule, CalendarModule, ToastModule, TooltipModule,ConfirmDialogModule
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CustomersComponent implements OnInit {

  // Variáveis de visualização
  displayDocumentModal = false;
  sanitizedDocUrl: SafeResourceUrl | null = null;
  currentBlobUrl: string | null = null; 

  customers: any[] = [];
  
  // Modais
  displayModal = false;
  displayHistory = false;
  displayDocsModal = false; // Modal da Galeria (CNH + Comprovante)
  
  // Modal de Contrato no Histórico
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
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private imageCompressService: ImageCompressService,
    private pdfCompressService: PdfCompressService,
    private sanitizer: DomSanitizer
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

  // --- LÓGICA AUXILIAR NOVA ---
  
  // Verifica se é PDF para decidir qual tag HTML usar (<object> ou <img>)
  isPdf(url: string | null): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.includes('application/pdf') || url.startsWith('data:application/pdf');
  }

  // Sanitiza a URL para usar no iframe/object sem o Angular bloquear
  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ---------------------------

  showDialog() {
    this.isEditMode = false;
    this.selectedCustomerId = null;
    this.customerForm.reset({ 
      type: 'PF',
      name: '',
      document: '',
      phone: '',
      email: '',
    });
    this.fileNameCNH = '';
    this.fileNameProof = '';
    this.displayModal = true; 
  }

 editCustomer(customer: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.selectedCustomerId = customer.id;

    // --- LÓGICA DE SEPARAÇÃO DO ENDEREÇO ---
    let street = '';
    let number = '';
    let district = '';
    let city = '';
    
    // O formato salvo é: "Rua, Numero - Bairro - Cidade"
    if (customer.address) {
      // 1. Separa pelos traços
      const parts = customer.address.split(' - ');
      
      // Parte 0: "Rua, Numero"
      if (parts.length >= 1) {
        const streetParts = parts[0].split(', ');
        street = streetParts[0] || ''; 
        number = streetParts[1] || ''; // Se tiver número após a vírgula
      }
      
      // Parte 1: Bairro
      if (parts.length >= 2) {
        district = parts[1];
      }

      // Parte 2: Cidade
      if (parts.length >= 3) {
        city = parts[2];
      }
    }
    // ---------------------------------------

    this.customerForm.patchValue({
      name: customer.name,
      type: customer.type,
      document: customer.document,
      phone: customer.phone,
      email: customer.email,
      
      // Preenche os campos separados
      street: street, 
      number: number,
      district: district,
      city: city,
      zipCode: customer.zipCode || '', // Se você salvou o CEP separado, ok

      cnhUrl: customer.cnhUrl,
      proofUrl: customer.proofUrl
    });

    // Lógica para mostrar o nome do arquivo, se existir
    if (customer.cnhUrl) this.fileNameCNH = 'Documento Atual (Salvo)';
    else this.fileNameCNH = '';

    if (customer.proofUrl) this.fileNameProof = 'Comprovante Atual (Salvo)';
    else this.fileNameProof = '';
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

  async onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    
    if (file) {
      this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Otimizando arquivo...' });

      try {
        let finalResult: any;

        if (file.type === 'application/pdf') {
          console.log('Comprimindo PDF...');
          const compressedPdfFile = await this.pdfCompressService.compressPdf(file);
          finalResult = await this.fileToBase64(compressedPdfFile);
        } else if (file.type.startsWith('image/')) {
           console.log('Comprimindo Imagem...');
           finalResult = await this.imageCompressService.compressImage(file);
        }

        if (finalResult) {
          this.customerForm.patchValue({ [fieldName]: finalResult });
          
          if (fieldName === 'cnhUrl') this.fileNameCNH = file.name;
          if (fieldName === 'proofUrl') this.fileNameProof = file.name;

          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Arquivo pronto.' });
        }

      } catch (err) {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao processar arquivo.' });
      }
    }
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  onTabChange(event: any) {
    const type = event.index === 0 ? 'PF' : 'PJ';
    this.customerForm.patchValue({ type: type });
  }

  // --- VISUALIZADORES ---
  
  // 1. Abre o modal com os documentos do cliente (Gallery)
  viewDocuments(customer: any) {
    this.selectedCustomerDocs = customer;
    if (!customer.cnhUrl && !customer.proofUrl) {
      this.messageService.add({ severity: 'warn', summary: 'Vazio', detail: 'Nenhum documento anexado.' });
      return;
    }
    this.displayDocsModal = true;
  }

  openHistory(customer: any) {
    this.customerService.getHistory(customer.id).subscribe({
      next: (data) => {
        this.historyData = data;
        this.displayHistory = true;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar histórico.' })
    });
  }

  // Abertura segura de PDF (Contrato/Blob)
  viewContract(rental: any) {
    if (rental.contractUrl) {
      this.openSafeDoc(rental.contractUrl, true);
    } else {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Nenhum contrato assinado.' });
    }
  }

  viewDocumentUrl(base64Data: string | null) {
    if (base64Data) {
      this.openSafeDoc(base64Data, false);
    }
  }

  // Função genérica para abrir modal único com Blob
  openSafeDoc(dataUrl: string, isContractModal: boolean) {
    try {
      this.clearBlob();

      if (dataUrl.startsWith('data:')) {
        const blob = this.base64ToBlob(dataUrl);
        this.currentBlobUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
        
        if(isContractModal) {
            this.sanitizedContractUrl = safeUrl;
            this.displayContractModal = true;
        } else {
            this.sanitizedDocUrl = safeUrl;
            this.displayDocumentModal = true;
        }
      } else {
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
        
        if(isContractModal) {
            this.sanitizedContractUrl = safeUrl;
            this.displayContractModal = true;
        } else {
            this.sanitizedDocUrl = safeUrl;
            this.displayDocumentModal = true;
        }
      }
    } catch (e) {
      console.error('Erro ao abrir documento:', e);
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Arquivo inválido.' });
    }
  }

  base64ToBlob(base64: string) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  onCloseDocumentModal() {
    this.displayDocumentModal = false;
    this.displayContractModal = false; // Fecha ambos por garantia
    this.sanitizedDocUrl = null;
    this.sanitizedContractUrl = null;
    this.clearBlob();
  }

  clearBlob() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

 deleteCustomer(customer: any) {
    this.confirmationService.confirm({
        message: 'Tem certeza que deseja excluir ' + customer.name + '?',
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        acceptButtonStyleClass: 'p-button-danger p-button-text',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => {
            // --- AQUI ESTÁ A LÓGICA DE APAGAR ---
            this.customerService.delete(customer.id).subscribe({
                next: () => {
                    // 1. Mostra mensagem de sucesso
                    this.messageService.add({
                        severity: 'success', 
                        summary: 'Sucesso', 
                        detail: 'Registro excluído com sucesso', 
                        life: 3000
                    });

                    // 2. ATUALIZA A TABELA NA TELA
                    // Opção A: Recarregar tudo do banco
                     this.loadCustomers(); 
                    
                    // Opção B (Mais rápida): Remover apenas o item da lista localmente
                    this.customers = this.customers.filter(c => c.id !== customer.id);
                },
                error: (err) => {
                    // 3. Trata erro (ex: não pode apagar porque tem aluguel)
                    this.messageService.add({
                        severity: 'error', 
                        summary: 'Erro', 
                        detail: err.error.message || 'Erro ao excluir registro', // Pega a msg do backend
                        life: 4000
                    });
                }
            });
        }
    });
}

buscarCep() {
    // 1. Pega o valor do CEP do formulário
    let cep = this.customerForm.get('zipCode')?.value;

    if (cep) {
      // 2. Remove caracteres não numéricos (traço, ponto, underscore)
      cep = cep.replace(/\D/g, '');

      // 3. Verifica se tem 8 dígitos
      if (cep.length === 8) {
        
        // 4. Chama a API do ViaCEP
        this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`)
          .subscribe(dados => {
            
            if (!dados.erro) {
              // 5. Preenche o formulário automaticamente
              this.customerForm.patchValue({
                street: dados.logradouro,     // Rua
                district: dados.bairro,       // Bairro
                city: `${dados.localidade} - ${dados.uf}`, // Cidade - Estado
                // number: '' // O número a gente deixa vazio para o usuário digitar
              });

              // Opcional: Focar no campo número automaticamente
              // document.getElementById('numeroInput')?.focus();
            } else {
              // CEP não encontrado
              this.messageService.add({severity:'warn', summary:'Atenção', detail:'CEP não encontrado.'});
            }
          });
      }
    }
  }
}