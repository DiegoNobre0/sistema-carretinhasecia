import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, 
    InputTextModule, CheckboxModule, PasswordModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], 
      password: ['', Validators.required],
      remember: [false]
    });
  }

  // 1. AO INICIAR: Verifica se tem e-mail salvo
  ngOnInit() {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        remember: true // Já deixa marcado para facilitar
      });
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      
      this.authService.login(this.loginForm.value).subscribe({
        
        // SUCESSO
        next: (response) => {
          this.loading = false;
          // Salva token, redireciona, etc...
          localStorage.setItem('token', response.token);
          this.router.navigate(['/dashboard']); 
        },

        // ERRO (AQUI ESTÁ A MÁGICA)
        error: (err) => {
          this.loading = false;
          console.error(err);

          // Tenta pegar a mensagem que veio do backend (passo 1)
          // Se não vier nada, usa uma mensagem padrão
          const errorMessage = err.error?.message || 'Ocorreu um erro ao tentar entrar.';

          this.messageService.add({ 
            severity: 'error', 
            summary: 'Erro de Acesso', 
            detail: errorMessage,
            life: 3000 // Fica na tela por 3 segundos
          });
        }
      });
    } else {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Atenção', 
            detail: 'Preencha todos os campos corretamente.' 
        });
    }
  }
}