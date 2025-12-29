import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Services
import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { TrailerService } from '../../services/trailer.service';
import { PdfService } from '../../services/pdf.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';

// Services PrimeNG
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, TableModule,
    DropdownModule, CalendarModule, InputNumberModule,
    TagModule, TooltipModule, TabViewModule, ConfirmDialogModule,
    CheckboxModule, InputTextareaModule, ToastModule
  ],
  providers: [DatePipe, ConfirmationService, MessageService],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  currentBlobUrl: string | null = null;
  // Listas de Dados
  activeRentals: any[] = [];
  closedRentals: any[] = [];
  futureRentals: any[] = [];

  customers: any[] = [];
  trailers: any[] = [];

  // Variáveis de Controle
  isEditMode = false;
  editingId: string | null = null;
  disabledDates: Date[] = [];

  // --- MODAL DE LOCAÇÃO (CRIAÇÃO) ---
  displayModal = false;
  rentalForm: FormGroup;
  totalCalculado: number = 0;
  diasCalculados: number = 0;

  // Resumo Visual
  selectedCustomerObj: any = null;
  selectedTrailerObj: any = null;

  // --- MODAL DE DEVOLUÇÃO (FINALIZAÇÃO) ---
  displayReturnModal = false;
  returnForm: FormGroup;
  selectedRental: any = null; // A locação sendo finalizada
  returnFile: File | null = null; // O arquivo assinado para upload

  // --- MODAL DE CUSTOS EXTRAS ---
  displayCostModal = false;
  editingRental: any = null;
  costInput: number = 0;

  // --- MODAL DE PDF ---
  displayContractModal = false;
  sanitizedContractUrl: SafeResourceUrl | null = null;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private trailerService: TrailerService,
    private pdfService: PdfService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    // 1. Form da Locação
    this.rentalForm = this.fb.group({
      customerId: [null, Validators.required],
      trailerId: [null, Validators.required],
      dates: [null, Validators.required],
      dailyRate: [null, Validators.required],
      signalValue: [0],
      startTime: [new Date(), Validators.required],
      startNow: [false]
    });

    // 2. Form da Devolução
    this.returnForm = this.fb.group({
      returnDate: [new Date(), Validators.required],
      returnTime: [new Date(), Validators.required],
      hasDamage: [false],
      damageDescription: [''],
      damageCost: [0],
      lateFee: [0],
      cleaningFee: [0]
    });
  }

  ngOnInit() {
    this.loadData();
    this.rentalForm.valueChanges.subscribe(() => this.calculateTotal());
  }

  loadData() {
    // Locações
    this.rentalService.getRentals().subscribe({
      next: (data) => {

        // --- MUDANÇA AQUI: PEGA 'OPEN' E 'RESERVED' ---
        this.activeRentals = data.filter(r => r.status === 'OPEN' || r.status === 'RESERVED');

        // Histórico (Fechado ou Cancelado)
        this.closedRentals = data.filter(r => r.status === 'CLOSED' || r.status === 'CANCELED');

        // A lista futureRentals não é mais necessária para a tela, 
        // mas se quiser manter por garantia, pode deixar:
        this.futureRentals = data.filter(r => r.status === 'RESERVED');
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locações.' })
    });

    // ... restante do código (clientes e trailers) continua igual
    this.customerService.getCustomers().subscribe(data => this.customers = data);
    this.trailerService.getTrailers().subscribe(data => {
      this.trailers = data.filter(t => t.status !== 'MAINTENANCE');
    });
  }

  showDialog() {
    this.displayModal = true;
    this.isEditMode = false;
    this.editingId = null;

    // Reseta e define a hora padrão como "Agora"
    this.rentalForm.reset({
      signalValue: 0,
      startTime: new Date()
    });

    this.totalCalculado = 0;
    this.selectedCustomerObj = null;
    this.selectedTrailerObj = null;
    this.disabledDates = [];
  }

  // --- LÓGICA DE DATAS OCUPADAS ---
  onTrailerSelect() {
    const trailerId = this.rentalForm.get('trailerId')?.value;

    this.disabledDates = [];
    this.rentalForm.patchValue({ dates: null });
    this.calculateTotal();

    if (trailerId) {
      this.selectedTrailerObj = this.trailers.find(t => t.id === trailerId);

      // Verifica datas ocupadas no backend (se implementado)
      // @ts-ignore
      if (this.trailerService['getBusyDates']) {
        // @ts-ignore
        this.trailerService.getBusyDates(trailerId).subscribe(ranges => {
          let allDisabled: Date[] = [];
          ranges.forEach((range: any) => {
            let current = new Date(range.startDate);
            const end = new Date(range.expectedEndDate);
            current.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            while (current <= end) {
              allDisabled.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          });
          this.disabledDates = [...allDisabled];
        });
      }
    }
  }

  calculateTotal() {
    const formVal = this.rentalForm.value;

    if (this.selectedCustomerObj?.isBlocked) {
      this.messageService.add({
        severity: 'error',
        summary: 'Bloqueado',
        detail: `Este cliente está bloqueado: ${this.selectedCustomerObj.blockReason || 'Sem motivo'}`
      });
      // Limpa a seleção
      this.rentalForm.patchValue({ customerId: null });
      this.selectedCustomerObj = null;
      return;
    }

    if (formVal.customerId) {
      this.selectedCustomerObj = this.customers.find(c => c.id === formVal.customerId);
    }
    if (formVal.trailerId && !this.selectedTrailerObj) {
      this.selectedTrailerObj = this.trailers.find(t => t.id === formVal.trailerId);
    }

    const dates = formVal.dates;
    const dailyRate = formVal.dailyRate;

    if (dates && dates[0] && dates[1] && dailyRate) {
      const diff = Math.abs(dates[1].getTime() - dates[0].getTime());
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
      this.diasCalculados = days;
      this.totalCalculado = days * dailyRate;
    } else {
      this.totalCalculado = 0;
    }
  }

  onSubmit() {
    if (this.rentalForm.valid) {
      const val = this.rentalForm.value;

      const timeComponent = new Date(val.startTime);

      const startDateBase = new Date(val.dates[0]);
      startDateBase.setHours(timeComponent.getHours(), timeComponent.getMinutes(), 0);

      const endDateBase = new Date(val.dates[1]);
      endDateBase.setHours(timeComponent.getHours(), timeComponent.getMinutes(), 0);

      const rentalStatus = val.startNow ? 'OPEN' : 'RESERVED';

      const payload = {
        customerId: val.customerId,
        trailerId: val.trailerId,

        startDate: startDateBase, // <--- Envia a data COM a hora correta
        expectedEndDate: endDateBase, // A data prevista de fim pode ficar 00:00 ou fim do dia, conforme sua regra

        dailyRate: val.dailyRate,
        signalValue: val.signalValue,
        totalValue: this.totalCalculado,
        status: rentalStatus
      };
      console.log('Enviando Payload:', payload);
      if (this.isEditMode && this.editingId) {
        this.rentalService.updateRental(this.editingId, payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Locação atualizada!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar.' })
        });
      } else {
        this.rentalService.createRental(payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Locação realizada!' });
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.error || 'Erro desconhecido' })
        });
      }
    }
  }

  // --- DOCUMENTOS (CONTRATO) ---
  onContractSelected(event: any, rental: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Arquivo muito grande. Máximo 10MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.rentalService.uploadContract(rental.id, e.target.result).subscribe({
          next: () => {
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Contrato anexado!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar.' })
        });
      };
      reader.readAsDataURL(file);
    }
  }

  viewContract(rental: any) {
    if (rental.contractUrl) {
      this.sanitizedContractUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rental.contractUrl);
      this.displayContractModal = true;
    } else {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Nenhum contrato anexado.' });
    }
  }

  // =========================================================
  // FLUXO DE DEVOLUÇÃO (FINALIZAÇÃO)
  // =========================================================

  openReturnModal(rental: any) {
    this.selectedRental = rental;
    this.displayReturnModal = true;
    this.returnFile = null;

    // Define data/hora atuais como sugestão de devolução
    const now = new Date();

    this.returnForm.reset({
      returnDate: now,
      returnTime: now,
      hasDamage: false,
      damageDescription: '',
      damageCost: 0,
      lateFee: 0,
      cleaningFee: 0
    });

    // --- ADICIONE ISTO: Ouve mudanças para recalcular a multa em tempo real ---
    this.returnForm.get('returnDate')?.valueChanges.subscribe(() => this.calculateReturnFees());
    this.returnForm.get('returnTime')?.valueChanges.subscribe(() => this.calculateReturnFees());

    // Roda uma vez inicial para já calcular se abriu o modal atrasado
    setTimeout(() => this.calculateReturnFees(), 100);
  }
  // PASSO 1: Apenas Baixar o PDF
  generateReturnOnly() {
    if (!this.selectedRental) return;

    this.pdfService.generateReturnTerm(
      this.selectedRental,
      this.returnForm.value
    );

    this.messageService.add({ severity: 'info', summary: 'Download', detail: 'Imprima, assine e anexe.' });
  }

  // PASSO 2: Selecionar o Arquivo Assinado
  onReturnFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.returnFile = file;
    }
  }

  // --- ALTERAÇÃO 2: Upload na Finalização ---
  finalCheckAndFinish() {
    debugger
    if (!this.selectedRental || !this.returnFile) return;

    this.messageService.add({ severity: 'info', summary: 'Aguarde', detail: 'Salvando termo e finalizando...' });

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64File = e.target.result;

      // AQUI MUDOU: Chama uploadReturnTerm em vez de uploadContract
      this.rentalService.uploadReturnTerm(this.selectedRental.id, base64File).subscribe({
        next: () => {
          this.finishRentalOnBackend(); // Segue para fechar a locação
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha no upload do termo.' })
      });
    };
    reader.readAsDataURL(this.returnFile);
  }
  // PASSO 4: Mudar Status no Banco
 finishRentalOnBackend() {
    // Validação básica
    if (!this.selectedRental || !this.returnForm.value.returnDate) return;

    // 1. MESCLAR DATA E HORA DE DEVOLUÇÃO (Crucial para o banco salvar o horário certo)
    const formVal = this.returnForm.value;
    const finalEndDate = new Date(formVal.returnDate);
    
    if (formVal.returnTime) {
      const time = new Date(formVal.returnTime);
      finalEndDate.setHours(time.getHours(), time.getMinutes(), 0);
    }

    // 2. CALCULAR O VALOR FINAL REAL
    // Pega o valor original da locação (Base)
    const baseValue = this.selectedRental.totalValue || 0;
    
    // Soma os extras do formulário
    const extras = (formVal.lateFee || 0) + (formVal.cleaningFee || 0) + (formVal.damageCost || 0);
    
    // Valor final a ser salvo no banco (Base + Extras)
    const finalTotalValue = baseValue + extras;

    const payload = {
      endDate: finalEndDate,
      totalValue: finalTotalValue 
    };

    console.log('Enviando Finalização:', payload); // <--- AJUDA NO DEBUG

    this.rentalService.finishRental(this.selectedRental.id, payload).subscribe({
      next: () => {
        this.loadData();
        this.displayReturnModal = false;
        this.messageService.add({ severity: 'success', summary: 'Concluído', detail: 'Locação finalizada com sucesso!' });
      },
      error: (err) => {
        console.error('Erro backend:', err); // <--- OLHE ISSO NO CONSOLE DO NAVEGADOR
        
        // Tenta mostrar a mensagem específica do backend, se houver
        const msgErro = err.error?.message || 'Falha ao finalizar no sistema';
        
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erro', 
          detail: msgErro 
        });
      }
    });
  }
  // --- OUTRAS FUNÇÕES ---

  openCostDialog(rental: any) {
    this.editingRental = rental;
    this.costInput = rental.extraCosts || 0;
    this.displayCostModal = true;
  }

  onSaveCost() {
    if (this.editingRental) {
      this.rentalService.updateExtraCosts(this.editingRental.id, this.costInput).subscribe({
        next: () => {
          this.displayCostModal = false;
          this.loadData();
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Custos atualizados!' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar custos.' })
      });
    }
  }

  // --- HELPERS ---
  getBaseValue(rental: any): number {
    return rental.totalValue - (rental.extraCosts || 0);
  }

  generateDraftDoc(type: 'CONTRACT' | 'PROMISSORY') {
    if (!this.rentalForm.valid) return;
    const draftData = {
      customer: this.selectedCustomerObj,
      trailer: this.selectedTrailerObj,
      startDate: this.rentalForm.value.dates[0],
      expectedEndDate: this.rentalForm.value.dates[1],
      totalValue: this.totalCalculado,
      dailyRate: this.rentalForm.value.dailyRate
    };
    if (type === 'CONTRACT') this.pdfService.generateContract(draftData);
    else this.pdfService.generatePromissoryNote(draftData);
  }

  generateContract(rental: any) {
    this.pdfService.generateContract(rental);
  }

  getRentalStatus(rental: any): 'LATE' | 'TODAY' | 'OK' {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expected = new Date(rental.expectedEndDate); expected.setHours(0, 0, 0, 0);
    if (today.getTime() > expected.getTime()) return 'LATE';
    if (today.getTime() === expected.getTime()) return 'TODAY';
    return 'OK';
  }

  confirmDelete(event: Event, rental: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir esta locação?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.rentalService.deleteRental(rental.id).subscribe({
          next: () => {
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Locação excluída!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir.' })
        });
      }
    });
  }

  editRental(rental: any) {
    this.isEditMode = true;
    this.editingId = rental.id;
    this.displayModal = true;

    // Cria os objetos de data baseados no que veio do banco
    const start = new Date(rental.startDate);
    const end = new Date(rental.expectedEndDate);

    this.rentalForm.patchValue({
      customerId: rental.customerId,
      dates: [start, end],

      startTime: start, // <--- O PrimeNG é esperto e extrai a hora desse objeto Date

      dailyRate: rental.dailyRate,
      signalValue: rental.signalValue,
      trailerId: rental.trailerId
    });

    this.rentalForm.get('trailerId')?.enable();
    this.calculateTotal();

    setTimeout(() => {
      this.rentalForm.patchValue({ trailerId: rental.trailerId });
    }, 100);
  }
  // --- ALTERAÇÃO 1: Função Genérica para Visualizar Documentos ---
  viewDocument(base64Data: string | null) {
    if (base64Data) {
      try {
        // 1. Verifica se é um Base64 puro (data:application/pdf...)
        if (base64Data.startsWith('data:')) {
          // Converte para BLOB (Arquivo na memória)
          const blob = this.base64ToBlob(base64Data);

          // Cria uma URL temporária (blob:http://localhost...)
          this.currentBlobUrl = URL.createObjectURL(blob);

          // Sanitiza para o Angular aceitar
          this.sanitizedContractUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);

        } else {
          // Caso seja uma URL normal (ex: https://s3...)
          this.sanitizedContractUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);
        }

        this.displayContractModal = true;

      } catch (e) {
        console.error('Erro ao processar PDF:', e);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Arquivo corrompido ou inválido.' });
      }
    } else {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Documento não disponível.' });
    }
  }

  // Função Mágica: Converte a string gigante em um arquivo Blob leve
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

  // Limpeza de memória quando fechar o modal
  onCloseContractModal() {
    this.displayContractModal = false;
    this.sanitizedContractUrl = null;

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl); // Libera memória do navegador
      this.currentBlobUrl = null;
    }
  }

  confirmPickup(rental: any) {
    this.rentalService.startRental(rental.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Locação iniciada!' });
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao iniciar.' })
    });
  }


  // --- LÓGICA DE MULTA POR ATRASO ---
  calculateReturnFees() {
    if (!this.selectedRental) return;

    const formVal = this.returnForm.value;
    if (!formVal.returnDate || !formVal.returnTime) return;

    // 1. Monta a Data Real da Devolução (Junta Data + Hora do formulário)
    const actualReturnDate = new Date(formVal.returnDate);
    const timeComponent = new Date(formVal.returnTime);
    actualReturnDate.setHours(timeComponent.getHours(), timeComponent.getMinutes(), 0);

    // 2. Pega a Data Prevista (Do contrato)
    const expectedDate = new Date(this.selectedRental.expectedEndDate);

    // 3. Calcula a diferença em milissegundos
    const diffMs = actualReturnDate.getTime() - expectedDate.getTime();

    // Se entregou ANTES ou NA HORA, multa é zero
    if (diffMs <= 0) {
      this.returnForm.patchValue({ lateFee: 0 }, { emitEvent: false });
      return;
    }

    // 4. Converte para minutos e horas
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    const dailyRate = this.selectedRental.dailyRate;
    let calculatedFee = 0;

    // --- REGRAS DE NEGÓCIO ---

    // REGRA 1: Tolerância de 1 hora (60 minutos)
    if (diffMinutes <= 60) {
      calculatedFee = 0;
    }
    // REGRA 2: Passou de 1h até 3h (60min a 180min) -> Cobra 1/3 da diária
    else if (diffMinutes <= 180) {
      calculatedFee = dailyRate / 3;
    }
    // REGRA 3: Passou de 3h -> Cobra novas diárias
    else {
      // Calcula quantas diárias extras se passaram
      // (Subtrai 1h da tolerância para ser justo na contagem de ciclos de 24h)
      const extraDays = Math.ceil((diffMinutes - 60) / (60 * 24));
      calculatedFee = extraDays * dailyRate;
    }

    // Atualiza o campo no formulário (formatado com 2 casas decimais)
    this.returnForm.patchValue({
      lateFee: parseFloat(calculatedFee.toFixed(2))
    }, { emitEvent: false }); // emitEvent: false evita loop infinito
  }
}