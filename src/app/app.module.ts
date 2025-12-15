import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './pages/home/home.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { UsersComponent } from './pages/users/users.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog'; 
import { ConfirmationService } from 'primeng/api';

registerLocaleData(localePt);


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },MessageService, { provide: LOCALE_ID, useValue: 'pt-BR' },ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
