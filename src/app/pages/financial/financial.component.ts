import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { FinancialService } from '../../services/financial.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';

// Services do PrimeNG
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    ButtonModule, 
    TableModule, 
    DialogModule, 
    InputTextModule, 
    InputNumberModule, 
    DropdownModule, 
    CalendarModule, 
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService], // Injeção local dos serviços
  templateUrl: './financial.component.html',
  styleUrls: ['./financial.component.scss']
})
export class FinancialComponent implements OnInit {
  
  statement: any[] = [];
  balance: number = 0;
  
  // Controle de Interface
  displayModal = false;
  transactionForm: FormGroup;
  
  // Filtro
  dateFilter: Date[] | null = null;

  // Edição
  isEditMode = false;
  editingId: string | null = null;

  types = [
    { label: 'Receita', value: 'INCOME' },
    { label: 'Despesa', value: 'EXPENSE' }
  ];

  categories = [
    { label: 'Conta de Luz', value: 'Energia' },
    { label: 'Conta de Água', value: 'Água' },
    { label: 'Internet', value: 'Internet' },
    { label: 'Impostos', value: 'Impostos' },
    { label: 'Material de Escritório', value: 'Escritório' },
    { label: 'Pró-labore', value: 'Salário' },
    { label: 'Outros', value: 'Outros' }
  ];

  constructor(
    private financialService: FinancialService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.transactionForm = this.fb.group({
      description: ['', Validators.required],
      type: ['EXPENSE', Validators.required],
      category: ['Outros', Validators.required],
      amount: [null, Validators.required],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    let start, end;
    
    // Processa as datas do filtro se existirem
    if (this.dateFilter && this.dateFilter[0] && this.dateFilter[1]) {
      start = this.dateFilter[0].toISOString();
      end = this.dateFilter[1].toISOString();
    }

    this.financialService.getStatement(start, end).subscribe({
      next: (data) => {
        this.statement = data.statement;
        this.balance = data.balance;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar extrato.' })
    });
  }

  // --- FILTROS ---
  onFilterChange() {
    this.loadData();
  }

  clearFilter() {
    this.dateFilter = null;
    this.loadData();
  }

  // --- AÇÕES DO MODAL ---
  showDialog() {
    this.displayModal = true;
    this.isEditMode = false;
    this.editingId = null;
    this.transactionForm.reset({ type: 'EXPENSE', date: new Date() });
  }

  editTransaction(item: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.editingId = item.id;

    this.transactionForm.patchValue({
      description: item.description,
      type: item.type,
      category: item.category,
      amount: item.amount,
      date: new Date(item.date)
    });
  }

  // --- EXCLUIR ---
  deleteTransaction(item: any) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este lançamento?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.financialService.deleteTransaction(item.id).subscribe({
          next: () => {
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Excluído', detail: 'Lançamento removido.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir.' })
        });
      }
    });
  }

  // --- SALVAR (CRIAR OU EDITAR) ---
  onSubmit() {
    if (this.transactionForm.valid) {
      const val = this.transactionForm.value;

      if (this.isEditMode && this.editingId) {
        // UPDATE
        this.financialService.updateTransaction(this.editingId, val).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Lançamento editado com sucesso!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar.' })
        });
      } else {
        // CREATE
        this.financialService.createTransaction(val).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lançamento registrado!' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao registrar.' })
        });
      }
    }
  }
}