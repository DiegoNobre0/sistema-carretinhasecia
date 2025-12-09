import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, 
    DialogModule, InputTextModule, DropdownModule, PasswordModule,
    TagModule, ToastModule, ConfirmDialogModule, TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  
  users: any[] = [];
  displayModal = false;
  userForm: FormGroup;
  
  // Controle de Edição
  isEditMode = false;
  editingUserId: string | null = null;

  roles = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Operador / Funcionário', value: 'OPERADOR' }
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // Obrigatória no inicio
      role: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao listar usuários.' })
    });
  }

  // --- ABRIR MODAL PARA CRIAR ---
  showDialog() {
    this.displayModal = true;
    this.isEditMode = false;
    this.editingUserId = null;
    
    // Reseta form e coloca Senha como Obrigatória
    this.userForm.reset({ role: 'OPERADOR' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  // --- ABRIR MODAL PARA EDITAR ---
  editUser(user: any) {
    this.displayModal = true;
    this.isEditMode = true;
    this.editingUserId = user.id;

    // Preenche os dados
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Senha vem vazia
    });

    // Na edição, a senha é OPCIONAL (só remove validação de required)
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.addValidators([Validators.minLength(6)]); // Mantém minLength se digitar
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onSubmit() {
    
    if (this.userForm.valid) {
      const payload = this.userForm.value;

      if (this.isEditMode && this.editingUserId) {
        // --- ATUALIZAR ---
        this.userService.updateUser(this.editingUserId, payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Atualizado', detail: 'Usuário editado com sucesso!' });
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar.' })
        });

      } else {
        // --- CRIAR ---
        this.userService.createUser(payload).subscribe({
          next: () => {
            this.displayModal = false;
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Criado', detail: 'Usuário criado com sucesso!' });
          },
          error: (err) => {
            // ADICIONE ESTE LOG:
            console.error('ERRO DETALHADO:', err); 
            
            // Tenta mostrar a mensagem que veio do backend
            const errorMsg = err.error?.error || 'Erro desconhecido ao criar usuário.';
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: errorMsg });
          }
        });
      }
    }
  }

  deleteUser(user: any) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja remover ${user.name}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Usuário excluído.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir.' })
        });
      }
    });
  }
}