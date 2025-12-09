import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); // <--- Injetamos o serviço aqui

  // Usamos a lógica centralizada do seu serviço
  if (authService.isAdmin()) {
    console.log('AdminGuard: Acesso permitido (É Admin)');
    return true;
  }

  console.log('AdminGuard: Acesso negado. Redirecionando para Locações.');
  return router.createUrlTree(['/dashboard/locacoes']);
};