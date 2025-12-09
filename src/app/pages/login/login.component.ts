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
      
      const { email, password, remember } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: (res) => {
          // --- LÓGICA DO LEMBRAR-ME ---
          if (remember) {
            localStorage.setItem('saved_email', email);
          } else {
            localStorage.removeItem('saved_email');
          }

          // --- SALVAR SESSÃO (Essencial para o AuthGuard) ---
          // Salva o token que veio do backend
          if (res.token) {
            localStorage.setItem('token', res.token);
            // Se o backend mandar os dados do usuário, salva também
            localStorage.setItem('user', JSON.stringify(res));
          }

          this.messageService.add({ severity: 'success', summary: 'Bem-vindo', detail: 'Login realizado!' });
          
          // Redireciona
          // Pequeno delay para mostrar o toast (opcional)
          setTimeout(() => {
             // Lógica anterior: Se for ADMIN vai pra home, se não vai pra locações (controlado pelo Guard ou aqui)
             this.router.navigate(['/dashboard/home']); 
          }, 500);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'E-mail ou senha inválidos' });
        }
      });
    } else {
      // Caso o usuário clique sem preencher tudo
      this.loginForm.markAllAsTouched();
    }
  }
}