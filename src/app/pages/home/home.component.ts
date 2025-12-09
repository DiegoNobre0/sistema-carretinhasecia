import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ChartModule, 
    DropdownModule, 
    ButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isAdmin = false;
  // Filtros
  selectedMonth: any = null;
  selectedYear: number = new Date().getFullYear();
  
  months = [
    { label: 'Ano Inteiro', value: null },
    { label: 'Janeiro', value: 1 },
    { label: 'Fevereiro', value: 2 },
    { label: 'Março', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Maio', value: 5 },
    { label: 'Junho', value: 6 },
    { label: 'Julho', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Setembro', value: 9 },
    { label: 'Outubro', value: 10 },
    { label: 'Novembro', value: 11 },
    { label: 'Dezembro', value: 12 }
  ];

  // Agora é um array vazio que será preenchido
  years: number[] = [];

  // Dados
  kpis = { revenue: 0, expenses: 0, profit: 0, ticketAverage: 0, totalRentals: 0 };
  topTrailers: any[] = [];
  topClients: any[] = [];
  
  chartData: any;
  chartOptions: any;

  constructor(private dashboardService: DashboardService,private authService: AuthService) {}

  ngOnInit() {
   
    this.isAdmin = this.authService.isAdmin();    
    this.generateYears(); // <--- Gera os anos dinamicamente
    this.loadDashboard();
    this.initChartConfig();
  }

  // FUNÇÃO NOVA: Gera lista de anos
  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // Ano que a empresa começou (pode ajustar)
    
    // Cria um array do ano atual descendo até 2020
    // Ex: [2025, 2024, 2023, 2022, 2021, 2020]
    for (let i = currentYear; i >= startYear; i--) {
      this.years.push(i);
    }
    
    // Se quiser permitir planejar o futuro, pode adicionar +1 ano:
    // this.years.unshift(currentYear + 1);
  }

  loadDashboard() {
    this.dashboardService.getMetrics(this.selectedMonth, this.selectedYear).subscribe(data => {
      this.kpis = data.kpis;
      this.topTrailers = data.topTrailers;
      this.topClients = data.topClients;
      this.updateChart(data.kpis.revenue, data.kpis.expenses);
    });
  }

  onFilter() {
    this.loadDashboard();
  }

  updateChart(receita: number, despesa: number) {
    this.chartData = {
      labels: ['Total do Período'],
      datasets: [
        {
          label: 'Receita',
          backgroundColor: '#00C851',
          data: [receita]
        },
        {
          label: 'Despesa',
          backgroundColor: '#ff4444',
          data: [despesa]
        }
      ]
    };
  }

  initChartConfig() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#ffffff' } }
      },
      scales: {
        x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    };
  }
}