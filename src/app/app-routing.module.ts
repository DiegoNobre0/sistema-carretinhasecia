import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { TrailersComponent } from './pages/trailers/trailers.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { RentalsComponent } from './pages/rentals/rentals.component';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { authGuard } from './core/guards/auth.guard';
import { SenatranComponent } from './pages/senatran/senatran.component';
import { BackupComponent } from './pages/backup/backup.component';
import { FinancialComponent } from './pages/financial/financial.component';
import { AgendaComponent } from './pages/agenda/agenda.component';

const routes: Routes = [
  // Rota Pública (Login)
  { path: 'login', component: LoginComponent },

  // Rota Privada (Dashboard)
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent }, 
      { path: 'carretinhas', component: TrailersComponent },
      { path: 'clientes', component: CustomersComponent },
      { path: 'locacoes', component: RentalsComponent },
      { path: 'manutencao', component: MaintenanceComponent },
      { path: 'senatran', component: SenatranComponent },
      { path: 'backup', component: BackupComponent },
      { path: 'financeiro', component: FinancialComponent },
      { path: 'agenda', component: AgendaComponent }
    ]
  },

  
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }