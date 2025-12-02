import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardService } from '../../services/dashboard.service'; // <--- Importe o Service

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  
  // Variáveis para guardar os dados reais
  kpis = {
    revenue: 0,
    expenses: 0,
    profit: 0,
    ticketAverage: 0,
    totalRentals: 0
  };

  topTrailers: any[] = [];
  
  chartData: any;
  chartOptions: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboard();
    this.initChartConfig(); // Configurações visuais do gráfico
  }

  loadDashboard() {
    this.dashboardService.getMetrics().subscribe(data => {
      // 1. Atualiza os Cards (KPIs)
      this.kpis = data.kpis;
      
      // 2. Atualiza a lista de Top Carretinhas
      this.topTrailers = data.topTrailers;

      // 3. Atualiza o Gráfico (Exemplo simples: Receita vs Despesa)
      this.updateChart(data.kpis.revenue, data.kpis.expenses);
    });
  }

  updateChart(receita: number, despesa: number) {
    this.chartData = {
      labels: ['Total Acumulado'], // Pode melhorar depois para "Por Mês"
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