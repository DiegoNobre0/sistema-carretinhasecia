import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, TableModule, DialogModule, InputTextModule, 
    InputNumberModule, DropdownModule, CalendarModule, TagModule
  ],
  templateUrl: './financial.component.html',
  styleUrls: ['./financial.component.scss']
})
export class FinancialComponent implements OnInit {
  
  statement: any[] = [];
  balance: number = 0;
  displayModal = false;
  transactionForm: FormGroup;

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
    { label: 'Outros', value: 'Outros' }
  ];

  constructor(
    private financialService: FinancialService,
    private fb: FormBuilder
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
    this.financialService.getStatement().subscribe(data => {
      this.statement = data.statement;
      this.balance = data.balance;
    });
  }

  showDialog() {
    this.displayModal = true;
    this.transactionForm.reset({ type: 'EXPENSE', date: new Date() });
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      this.financialService.createTransaction(this.transactionForm.value).subscribe({
        next: () => {
          this.displayModal = false;
          this.loadData();
          alert('Lançamento realizado!');
        },
        error: () => alert('Erro ao salvar.')
      });
    }
  }
}