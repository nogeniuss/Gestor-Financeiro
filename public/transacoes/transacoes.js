// Namespace para utilitários financeiros
const FinanceUtils = {
    // Formatar valores monetários
    formatCurrency: function(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    // Formatar datas
    formatDate: function(dateString) {
        if (!dateString) return '';
        
        // Verificar se é uma string no formato ISO (YYYY-MM-DD)
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // Verificar se é uma string no formato brasileiro (DD/MM/YYYY)
        if (typeof dateString === 'string' && dateString.includes('/')) {
            return dateString;
        }
        
        // Se for um objeto Date
        if (dateString instanceof Date) {
            const day = String(dateString.getDate()).padStart(2, '0');
            const month = String(dateString.getMonth() + 1).padStart(2, '0');
            const year = dateString.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        return '';
    },
    
    // Converter data do formato DD/MM/YYYY para objeto Date
    parseBRDate: function(dateString) {
        if (!dateString) return null;
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
    },
    
    // Converter data do formato YYYY-MM-DD para objeto Date
    parseISODate: function(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    },
    
    // Formatar data para a API (YYYY-MM-DD)
    formatDateForAPI: function(date) {
        if (!date) return '';
        if (typeof date === 'string' && date.includes('-')) return date;
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    // Buscar dados da API
    fetchData: async function(endpoint, params = {}) {
        const queryParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value);
            }
        }
        
        const url = `${endpoint}?${queryParams.toString()}`;
        console.log(`Buscando dados em: ${url}`);
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erro na requisição (${response.status}):`, errorText);
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Dados recebidos de ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`Erro ao buscar dados de ${endpoint}:`, error);
            this.showAlert(`Erro ao buscar dados: ${error.message}`, 'danger');
            throw error;
        }
    },
    
    // Exibir alertas na interface
    showAlert: function(message, type = 'info') {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) return;
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.role = 'alert';
        
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        alertsContainer.appendChild(alertElement);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    },
    
    // Gerar cores aleatórias para gráficos
    generateColors: function(count, opacity = 0.7) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 137.5) % 360;
            colors.push(`hsla(${hue}, 70%, 60%, ${opacity})`);
        }
        return colors;
    },
    
    // Mapa de cores para categorias específicas
    categoryColors: {
        'Alimentação': 'rgba(255, 99, 132, 0.7)',
        'Uber': 'rgba(54, 162, 235, 0.7)',
        'Apostas': 'rgba(255, 206, 86, 0.7)',
        'Aluguel': 'rgba(75, 192, 192, 0.7)',
        'Energia': 'rgba(153, 102, 255, 0.7)',
        'Dogs': 'rgba(255, 159, 64, 0.7)',
        'Gás': 'rgba(199, 199, 199, 0.7)',
        'Pix Recebido': 'rgba(83, 225, 138, 0.7)',
        'Pix Enviado': 'rgba(225, 83, 83, 0.7)',
        'Transferências': 'rgba(201, 203, 207, 0.7)',
        'Investimentos': 'rgba(139, 195, 74, 0.7)',
        'Outras': 'rgba(158, 158, 158, 0.7)'
    },
    
    // Obter cor para uma categoria
    getCategoryColor: function(category) {
        return this.categoryColors[category] || 'rgba(158, 158, 158, 0.7)';
    }
};

// Variáveis globais para os gráficos
let balanceChart = null;
let expensesChart = null;
let comparisonChart = null;
let categoriesChart = null;
let trendsChart = null;
let expensesHeatmap = null;
let balanceHeatmap = null;
let goalsChart = null;

// Variáveis para controle de dados
let currentFilters = {
    startDate: null,
    endDate: null,
    category: '',
    type: ''
};

// // Configurar datas padrão (mês anterior)
// function setupDefaultDates() {
//     const today = new Date();
    
//     // Obter o primeiro dia do mês anterior
//     const firstDayPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
//     // Obter o último dia do mês anterior
//     const lastDayPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
//     const startDateInput = document.getElementById('start-date');
//     const endDateInput = document.getElementById('end-date');
    
//     if (startDateInput && endDateInput) {
//         startDateInput.valueAsDate = firstDayPreviousMonth;
//         endDateInput.valueAsDate = lastDayPreviousMonth;
        
//         currentFilters.startDate = FinanceUtils.formatDateForAPI(firstDayPreviousMonth);
//         currentFilters.endDate = FinanceUtils.formatDateForAPI(lastDayPreviousMonth);
//     }
    
//     // Atualizar o título da página ou algum elemento que indique o período
//     const periodIndicator = document.getElementById('period-indicator');
//     if (periodIndicator) {
//         const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
//                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
//         const previousMonth = firstDayPreviousMonth.getMonth();
//         const year = firstDayPreviousMonth.getFullYear();
        
//         periodIndicator.textContent = `Dados de ${monthNames[previousMonth]} de ${year}`;
//     }
// }


// Inicializar todos os gráficos
function initCharts() {
    initBalanceChart();
    initExpensesChart();
    initComparisonChart();
    initCategoriesChart();
    initTrendsChart();
    initHeatmaps();
    initGoalsChart();
}

// Inicializar gráfico de saldo
function initBalanceChart() {
    let ctx = document.getElementById('balance-chart');
    
    // Se o elemento não existir, criar dinamicamente
    if (!ctx) {
        console.log('Elemento canvas para o gráfico de saldo não encontrado. Criando dinamicamente...');
        
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            ctx = document.createElement('canvas');
            ctx.id = 'balance-chart';
            chartContainer.appendChild(ctx);
        } else {
            console.error('Container para o gráfico de saldo não encontrado');
            return;
        }
    }
    
    
    // Destruir instância anterior se existir
    if (balanceChart) {
        balanceChart.destroy();
    }
    
    
    // Garantir que o canvas tenha dimensões adequadas
    ctx.style.width = '100%';
    ctx.style.height = '100%';
    
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Saldo',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return FinanceUtils.formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Saldo: ${FinanceUtils.formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
    
}


 // Inicializar gráfico de gastos
// function initExpensesChart() {
//     const ctx = document.getElementById('expenses-chart');
//     if (!ctx) return;
    
//     if (expensesChart) expensesChart.destroy();
    
//     expensesChart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: [],
//             datasets: [{
//                 label: 'Gastos Diários',
//                 data: [],
//                 borderColor: 'rgba(255, 99, 132, 1)',
//                 backgroundColor: 'rgba(255, 99, 132, 0.2)',
//                 fill: true,
//                 tension: 0.4
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//                 x: {
//                     grid: {
//                         display: false
//                     }
//                 },
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         callback: function(value) {
//                             return FinanceUtils.formatCurrency(value);
//                         }
//                     }
//                 }
//             },
//             plugins: {
//                 tooltip: {
//                     callbacks: {
//                         label: function(context) {
//                             return `Gastos: ${FinanceUtils.formatCurrency(context.raw)}`;
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

// Inicializar gráfico de comparação saldo x gastos
function initComparisonChart() {
    const ctx = document.getElementById('comparison-chart');
    if (!ctx) {
        console.log('Creating comparison chart canvas...');
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = 'comparison-chart';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        }
    }

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Saldo',
                    data: [],
                    type: 'line',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    yAxisID: 'y'
                },
                {
                    label: 'Gastos',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Proporção Gastos/Saldo (%)',
                    data: [],
                    type: 'line',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        callback: value => `R$ ${value.toFixed(2)}`
                    }
                },
                y1: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    ticks: {
                        callback: value => `${value.toFixed(1)}%`
                    }
                }
            }
        }
    });
}


// Inicializar gráfico de categorias
 function initCategoriesChart() {
    console.log("initCategoriesChart chamado");
     const ctx = document.getElementById('categories-chart');
     if (!ctx) return;
    
     if (categoriesChart) categoriesChart.destroy();
    
     categoriesChart = new Chart(ctx, {
         type: 'doughnut',
         data: {
             labels: [],
             datasets: [{
                 data: [],
                 backgroundColor: [],
                 borderWidth: 1
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
                 legend: {
                     position: 'right',
                     labels: {
                         font: {
                             size: 12
                         },
                         color: '#333'
                     }
                 },
                 tooltip: {
                     callbacks: {
                         label: function(context) {
                             const label = context.label || '';
                             const value = context.raw || 0;
                             const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                             const percentage = Math.round((value / total) * 100);
                             return `${label}: ${FinanceUtils.formatCurrency(value)} (${percentage}%)`;
                         }
                     }
                 }
             }
         }
     });
 }
 function updateExpensesChart(data) {
    // First check if chart exists
    if (!expensesChart) {
        initExpensesChart();
    }
    
    // Validate data
    if (!data || !data.success || !data.gastosPorData) {
        console.log('Invalid expenses data received');
        return;
    }

    const dates = Object.keys(data.gastosPorData).sort();
    const values = dates.map(date => data.gastosPorData[date].valor);

    // Update chart data
    expensesChart.data.labels = dates;
    expensesChart.data.datasets[0].data = values;
    expensesChart.update();
}
// Inicializar gráfico de tendências
 function initTrendsChart() {
     const ctx = document.getElementById('trends-chart');
     if (!ctx) return;
    
     if (trendsChart) trendsChart.destroy();
    
     trendsChart = new Chart(ctx, {
         type: 'line',
         data: {
             labels: [],
             datasets: [
                 {
                     label: 'Receitas',
                     data: [],
                     borderColor: 'rgba(75, 192, 192, 1)',
                     backgroundColor: 'rgba(75, 192, 192, 0.2)',
                     fill: false,
                     tension: 0.4
                 },
                 {
                     label: 'Gastos',
                     data: [],
                     borderColor: 'rgba(255, 99, 132, 1)',
                     backgroundColor: 'rgba(255, 99, 132, 0.2)',
                     fill: false,
                     tension: 0.4
                 },
                 {
                     label: 'Saldo',
                     data: [],
                     borderColor: 'rgba(54, 162, 235, 1)',
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     fill: false,
                     tension: 0.4
                 }
             ]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             scales: {
                 x: {
                     grid: {
                         display: false
                     }
                 },
                 y: {
                     beginAtZero: true,
                     ticks: {
                         callback: function(value) {
                             return FinanceUtils.formatCurrency(value);
                         }
                     }
                 }
             },
             plugins: {
                 tooltip: {
                     callbacks: {
                         label: function(context) {
                             return `${context.dataset.label}: ${FinanceUtils.formatCurrency(context.raw)}`;
                         }
                     }
                 }
             }
         }
     });
 }

// Inicializar mapas de calor
 function initHeatmaps() {
     initExpensesHeatmap();
     initBalanceHeatmap();
 }

 // Inicializar mapa de calor de gastos
 function initExpensesHeatmap() {
     const ctx = document.getElementById('expenses-heatmap');
     if (!ctx) return;
    
     if (expensesHeatmap) expensesHeatmap.destroy();
    
     // Configuração inicial vazia
     expensesHeatmap = new Chart(ctx, {
         type: 'matrix',
         data: {
             datasets: [{
                 label: 'Gastos por Dia',
                 data: [],
                 backgroundColor(context) {
                     const value = context.dataset.data[context.dataIndex]?.v || 0;
                     const alpha = Math.min(Math.max(value / 1000, 0.1), 1);
                     return `rgba(255, 99, 132, ${alpha})`;
                 },
                 borderColor: 'white',
                 borderWidth: 1,
                 width: ({ chart }) => (chart.chartArea || {}).width / 7 - 1,
                 height: ({ chart }) => (chart.chartArea || {}).height / 5 - 1
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
                 tooltip: {
                     callbacks: {
                         title() {
                             return '';
                         },
                         label(context) {
                             const v = context.dataset.data[context.dataIndex];
                             return [
                                 `Data: ${v.x}`,
                                 `Valor: ${FinanceUtils.formatCurrency(v.v)}`
                             ];
                         }
                     }
                 },
                 legend: {
                     display: false
                 }
             },
             scales: {
                 x: {
                     type: 'category',
                     labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                     grid: {
                         display: false
                     }
                 },
                 y: {
                     type: 'category',
                     labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
                     offset: true,
                     grid: {
                         display: false
                     }
                 }
             }
         }
     });
 }

 // Inicializar mapa de calor de saldos
 function initBalanceHeatmap() {
     const ctx = document.getElementById('balance-heatmap');
     if (!ctx) return;
    
     if (balanceHeatmap) balanceHeatmap.destroy();
    
     // Configuração inicial vazia
     balanceHeatmap = new Chart(ctx, {
         type: 'matrix',
         data: {
             datasets: [{
                 label: 'Saldo por Dia',
                 data: [],
                 backgroundColor(context) {
                     const value = context.dataset.data[context.dataIndex]?.v || 0;
                     if (value > 0) {
                         const alpha = Math.min(Math.max(value / 5000, 0.1), 1);
                         return `rgba(75, 192, 192, ${alpha})`;
                     } else {
                         const alpha = Math.min(Math.max(Math.abs(value) / 5000, 0.1), 1);
                         return `rgba(255, 99, 132, ${alpha})`;
                     }
                 },
                 borderColor: 'white',
                 borderWidth: 1,
                 width: ({ chart }) => (chart.chartArea || {}).width / 7 - 1,
                 height: ({ chart }) => (chart.chartArea || {}).height / 5 - 1
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
                 tooltip: {
                     callbacks: {
                         title() {
                             return '';
                         },
                         label(context) {
                             const v = context.dataset.data[context.dataIndex];
                             return [
                                 `Data: ${v.x}`,
                                 `Saldo: ${FinanceUtils.formatCurrency(v.v)}`
                             ];
                         }
                     }
                 },
                 legend: {
                     display: false
                 }
             },
             scales: {
                 x: {
                     type: 'category',
                     labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                     grid: {
                         display: false
                     }
                 },
                 y: {
                     type: 'category',
                     labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
                     offset: true,
                     grid: {
                         display: false
                     }
                 }
             }
         }
     });
 }

 // Inicializar gráfico de metas
 function initGoalsChart() {
     const ctx = document.getElementById('goals-chart');
     if (!ctx) return;
    
     if (goalsChart) goalsChart.destroy();
    
     goalsChart = new Chart(ctx, {
         type: 'bar',
         data: {
             labels: ['Receitas', 'Gastos'],
             datasets: [
                 {
                     label: 'Atual',
                     data: [0, 0],
                     backgroundColor: [
                         'rgba(75, 192, 192, 0.7)',
                         'rgba(255, 99, 132, 0.7)'
                     ],
                     borderColor: [
                         'rgba(75, 192, 192, 1)',
                         'rgba(255, 99, 132, 1)'
                     ],
                     borderWidth: 1
                 },
                 {
                     label: 'Meta',
                     data: [0, 0],
                     backgroundColor: [
                         'rgba(75, 192, 192, 0.3)',
                         'rgba(255, 99, 132, 0.3)'
                     ],
                     borderColor: [
                         'rgba(75, 192, 192, 1)',
                         'rgba(255, 99, 132, 1)'
                     ],
                     borderWidth: 1,
                     borderDash: [5, 5]
                 }
             ]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             scales: {
                 x: {
                     grid: {
                         display: false
                     }
                 },
                 y: {
                     beginAtZero: true,
                     ticks: {
                         callback: function(value) {
                             return FinanceUtils.formatCurrency(value);
                         }
                     }
                 }
             },
             plugins: {
                 tooltip: {
                     callbacks: {
                         label: function(context) {
                             return `${context.dataset.label}: ${FinanceUtils.formatCurrency(context.raw)}`;
                         }
                     }
                 }
             }
         }
     });
 }

// Carregar dados para todos os gráficos
async function loadAllChartData() {
    try {
        // Remover spinners anteriores se existirem
        document.querySelectorAll('.loading-spinner').forEach(spinner => spinner.remove());
        
        // Mostrar indicadores de carregamento
        document.querySelectorAll('.chart-container').forEach(container => {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner text-center py-5';
            spinner.innerHTML = '<div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando dados...</p>';
            container.appendChild(spinner);
        });
        
        // Buscar dados em paralelo
        const [saldoData, gastosData, categoriasData, transacoesData] = await Promise.all([
            FinanceUtils.fetchData('/api/saldo-por-dia', currentFilters),
            FinanceUtils.fetchData('/api/gastos-por-data', currentFilters),
            FinanceUtils.fetchData('/api/valores-por-categoria', currentFilters),
            FinanceUtils.fetchData('/api/transacoes-recentes', currentFilters)
        ]);
        
        // Remover todos os spinners após carregar os dados
        document.querySelectorAll('.loading-spinner').forEach(spinner => spinner.remove());
        
        // Atualizar cada gráfico com os dados recebidos
        updateBalanceChart(saldoData);
        updateExpensesChart(gastosData);
        updateComparisonChart(saldoData, gastosData);
        updateCategoriesChart(categoriasData);
        updateTrendsChart(saldoData, gastosData);
        updateHeatmaps(gastosData, saldoData);
        updateGoalsChart(gastosData, saldoData);
        
        // Atualizar outros componentes
        updateTransactionsTable(transacoesData);
        updateTransactionSummary(transacoesData);
        generateInsights(saldoData, gastosData, categoriasData);
        
    } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error);
        FinanceUtils.showAlert('Erro ao carregar dados dos gráficos. Tente novamente mais tarde.', 'danger');
        
        // Remover spinners em caso de erro
        document.querySelectorAll('.loading-spinner').forEach(spinner => spinner.remove());
    }
}


// Atualizar gráfico de saldo -> corrijido
function updateBalanceChart(data) {
    
    if (!balanceChart) {
        console.error('Gráfico de saldo não inicializado');
        return;
    }
    
    if (!data.success || !data.saldoPorDia) {
        console.error('Dados de saldo inválidos:', data);
        return;
    }
    
    // Extrair datas e valores de saldo
    const dates = Object.keys(data.saldoPorDia).sort((a, b) => 
        FinanceUtils.parseBRDate(a) - FinanceUtils.parseBRDate(b)
    );
    
    
    const values = dates.map(date => data.saldoPorDia[date].valor);
    
    
    // Formatar datas para exibição (DD/MM)
    const formattedDates = dates.map(date => {
        const [day, month] = date.split('/');
        return `${day}/${month}`;
    });
    
    // Atualizar dados do gráfico
    balanceChart.data.labels = formattedDates;
    balanceChart.data.datasets[0].data = values;
    
    // Forçar atualização do gráfico
    balanceChart.update('none'); // Usar 'none' para evitar animações que podem causar problemas
    
}


function initExpensesChart() {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) {
        console.log('Creating expenses chart canvas...');
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = 'expenses-chart';
            chartContainer.appendChild(canvas);
            ctx = canvas;
        }
    }

    if (expensesChart) {
        expensesChart.destroy();
    }

    expensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Gastos Diários',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Atualizar gráfico de comparação
  function updateComparisonChart(saldoData, gastosData) {
      if (!comparisonChart || !saldoData.success || !gastosData.success) return;
    
//       Agrupar dados por mês
      const monthlyData = {};
    
//       Processar dados de saldo
      if (saldoData.saldoPorDia) {
          Object.entries(saldoData.saldoPorDia).forEach(([date, data]) => {
              const [day, month, year] = date.split('/');
              const monthYear = `${month}/${year}`;
            
              if (!monthlyData[monthYear]) {
                  monthlyData[monthYear] = {
                      saldo: 0,
                      gastos: 0,
                      proporcao: 0
                  };
              }
            
//               Usar o último saldo do mês
              if (!monthlyData[monthYear].lastDay || parseInt(day) > monthlyData[monthYear].lastDay) {
                  monthlyData[monthYear].saldo = data.valor;
                  monthlyData[monthYear].lastDay = parseInt(day);
              }
          });
      }
    
//       Processar dados de gastos
      if (gastosData.gastosPorData) {
          Object.entries(gastosData.gastosPorData).forEach(([date, data]) => {
              const [day, month, year] = date.split('/');
              const monthYear = `${month}/${year}`;
            
              if (!monthlyData[monthYear]) {
                  monthlyData[monthYear] = {
                      saldo: 0,
                      gastos: 0,
                      proporcao: 0
                  };
              }
            
              monthlyData[monthYear].gastos += data.valor;
          });
      }
    
//      Calcular proporção gasto/saldo
      Object.values(monthlyData).forEach(data => {
          if (data.saldo > 0) {
              data.proporcao = (data.gastos / data.saldo) * 100;
          } else {
              data.proporcao = data.gastos > 0 ? 100 : 0;
          }
      });
    
//       Preparar dados para o gráfico
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
        
          if (yearA !== yearB) return yearA - yearB;
          return monthA - monthB;
      });
    
//       Limitar aos últimos 6 meses para melhor visualização
      const recentMonths = sortedMonths.slice(-6);
    
//       Formatar labels para exibição
      const labels = recentMonths.map(monthYear => {
          const [month, year] = monthYear.split('/');
          return `${monthNames[parseInt(month) - 1]}/${year}`;
      });
    
//      Extrair valores
      const saldoValues = recentMonths.map(monthYear => monthlyData[monthYear].saldo);
      const gastosValues = recentMonths.map(monthYear => monthlyData[monthYear].gastos);
      const proporcaoValues = recentMonths.map(monthYear => monthlyData[monthYear].proporcao);
    
//       Atualizar dados do gráfico
      comparisonChart.data.labels = labels;
      comparisonChart.data.datasets[0].data = saldoValues;
      comparisonChart.data.datasets[1].data = gastosValues;
      comparisonChart.data.datasets[2].data = proporcaoValues;
      comparisonChart.update();
  }

 // Atualizar gráfico de categorias
 function updateCategoriesChart(data) {
     if (!categoriesChart || !data.success || !data.valoresPorCategoria) return;
    
//      Transformar o objeto em array e filtrar apenas valores positivos
     const categoriesData = Object.entries(data.valoresPorCategoria)
         .map(([category, details]) => ({
             category,
             value: details.valor
         }))
         .filter(item => item.value > 0);
    
//      Ordenar por valor (do maior para o menor)
     categoriesData.sort((a, b) => b.value - a.value);
    
//      Limitar a 8 categorias para melhor visualização
     const topCategories = categoriesData.slice(0, 8);
    
//      Preparar dados para o gráfico
     const labels = topCategories.map(item => item.category);
     const values = topCategories.map(item => item.value);
    
//      Definir cores com base nas categorias
     const colors = topCategories.map(item => FinanceUtils.getCategoryColor(item.category));
    
//      Atualizar dados do gráfico
     categoriesChart.data.labels = labels;
     categoriesChart.data.datasets[0].data = values;
     categoriesChart.data.datasets[0].backgroundColor = colors;
     categoriesChart.update();
 }

//  Atualizar gráfico de tendências
 function updateTrendsChart(saldoData, gastosData) {
     if (!trendsChart || !saldoData.success || !gastosData.success) return;
    
     // Agrupar dados por mês
     const monthlyData = {};
    
     // Processar dados de saldo
     if (saldoData.saldoPorDia) {
         Object.entries(saldoData.saldoPorDia).forEach(([date, data]) => {
             const [day, month, year] = date.split('/');
             const monthYear = `${month}/${year}`;
            
             if (!monthlyData[monthYear]) {
                 monthlyData[monthYear] = {
                     saldo: [],
                     gastos: 0,
                     receitas: 0
                 };
             }
            
             // Armazenar todos os saldos do mês para calcular a variação
             monthlyData[monthYear].saldo.push({
                 day: parseInt(day),
                 valor: data.valor
             });
         });
     }
    
     // Processar dados de gastos
     if (gastosData.gastosPorData) {
         Object.entries(gastosData.gastosPorData).forEach(([date, data]) => {
             const [day, month, year] = date.split('/');
             const monthYear = `${month}/${year}`;
            
             if (!monthlyData[monthYear]) {
                 monthlyData[monthYear] = {
                     saldo: [],
                     gastos: 0,
                     receitas: 0
                 };
             }
            
             monthlyData[monthYear].gastos += data.valor;
         });
     }
    
     // Calcular saldo final e receitas para cada mês
     Object.keys(monthlyData).forEach(monthYear => {
         const data = monthlyData[monthYear];
        
         // Ordenar saldos por dia
         data.saldo.sort((a, b) => a.day - b.day);
        
         if (data.saldo.length >= 2) {
             const firstSaldo = data.saldo[0].valor;
             const lastSaldo = data.saldo[data.saldo.length - 1].valor;
            
             // Variação de saldo no mês
             const saldoVariation = lastSaldo - firstSaldo;
            
             // Receitas = variação de saldo + gastos
             data.receitas = saldoVariation + data.gastos;
            
             // Usar o último saldo do mês como valor final
             data.saldoFinal = lastSaldo;
         } else if (data.saldo.length === 1) {
             data.saldoFinal = data.saldo[0].valor;
             data.receitas = data.gastos; // Estimativa
         } else {
             data.saldoFinal = 0;
             data.receitas = data.gastos; // Estimativa
         }
     });
    
     // Preparar dados para o gráfico
     const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
     const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
         const [monthA, yearA] = a.split('/').map(Number);
         const [monthB, yearB] = b.split('/').map(Number);
        
         if (yearA !== yearB) return yearA - yearB;
         return monthA - monthB;
     });
    
     // Limitar aos últimos 6 meses para melhor visualização
     const recentMonths = sortedMonths.slice(-6);
    
     // Formatar labels para exibição
     const labels = recentMonths.map(monthYear => {
         const [month, year] = monthYear.split('/');
         return `${monthNames[parseInt(month) - 1]}/${year}`;
     });
    
     // Extrair valores
     const receitasValues = recentMonths.map(monthYear => monthlyData[monthYear].receitas);
     const gastosValues = recentMonths.map(monthYear => monthlyData[monthYear].gastos);
     const saldoValues = recentMonths.map(monthYear => monthlyData[monthYear].saldoFinal);
    
     // Atualizar dados do gráfico
     trendsChart.data.labels = labels;
     trendsChart.data.datasets[0].data = receitasValues;
     trendsChart.data.datasets[1].data = gastosValues;
     trendsChart.data.datasets[2].data = saldoValues;
     trendsChart.update();
 }

 // Atualizar mapas de calor
 function updateHeatmaps(gastosData, saldoData) {
     updateExpensesHeatmapData(gastosData);
     updateBalanceHeatmapData(saldoData);
 }

 // Atualizar mapa de calor de gastos
 function updateExpensesHeatmapData(data) {
     if (!expensesHeatmap || !data.success || !data.gastosPorData) return;
    
     // Preparar dados para o mapa de calor
     const heatmapData = [];
    
     Object.entries(data.gastosPorData).forEach(([dateStr, data]) => {
         const date = FinanceUtils.parseBRDate(dateStr);
         if (!date) return;
        
         const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
        
         // Calcular a semana do mês (0-4)
         const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
         const dayOfMonth = date.getDate();
         const weekOfMonth = Math.floor((dayOfMonth - 1 + firstDayOfMonth.getDay()) / 7);
        
         // Adicionar dados ao mapa de calor
         heatmapData.push({
             x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
             y: `Semana ${weekOfMonth + 1}`,
             v: data.valor,
             d: dateStr
         });
     });
    
     // Atualizar dados do gráfico
     expensesHeatmap.data.datasets[0].data = heatmapData;
     expensesHeatmap.update();
 }

 // Atualizar mapa de calor de saldos
 function updateBalanceHeatmapData(data) {
     if (!balanceHeatmap || !data.success || !data.saldoPorDia) return;
    
     // Preparar dados para o mapa de calor
     const heatmapData = [];
    
     Object.entries(data.saldoPorDia).forEach(([dateStr, data]) => {
         const date = FinanceUtils.parseBRDate(dateStr);
         if (!date) return;
        
         const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
        
         // Calcular a semana do mês (0-4)
         const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
         const dayOfMonth = date.getDate();
         const weekOfMonth = Math.floor((dayOfMonth - 1 + firstDayOfMonth.getDay()) / 7);
        
         // Adicionar dados ao mapa de calor
         heatmapData.push({
             x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
             y: `Semana ${weekOfMonth + 1}`,
             v: data.valor,
             d: dateStr
         });
     });
    
     // Atualizar dados do gráfico
     balanceHeatmap.data.datasets[0].data = heatmapData;
     balanceHeatmap.update();
 }

 // Atualizar gráfico de metas
 function updateGoalsChart(gastosData, saldoData) {
      if (!goalsChart) return;
    
//       Calcular totais
      let totalReceitas = 0;
      let totalGastos = 0;
    
//       Calcular gastos totais
      if (gastosData.success && gastosData.gastosPorData) {
          totalGastos = Object.values(gastosData.gastosPorData).reduce((sum, item) => sum + item.valor, 0);
      }
    
//       Calcular receitas (estimativa baseada na variação de saldo + gastos)
      if (saldoData.success && saldoData.saldoPorDia) {
          const saldos = Object.entries(saldoData.saldoPorDia)
              .map(([date, data]) => ({
                  date: FinanceUtils.parseBRDate(date),
                  valor: data.valor
              }))
              .sort((a, b) => a.date - b.date);
        
          if (saldos.length >= 2) {
              const firstSaldo = saldos[0].valor;
              const lastSaldo = saldos[saldos.length - 1].valor;
              const saldoVariation = lastSaldo - firstSaldo;
            
//               Receitas = variação de saldo + gastos
              totalReceitas = saldoVariation + totalGastos;
          } else {
//               Se não temos dados suficientes, estimamos que receitas = gastos
              totalReceitas = totalGastos;
          }
      }
    
//       Definir metas (exemplo: receitas 20% acima dos gastos, gastos 10% abaixo do atual)
      const metaReceitas = totalReceitas * 1.2;
      const metaGastos = totalGastos * 0.9;
    
//       Atualizar dados do gráfico
      goalsChart.data.datasets[0].data = [totalReceitas, totalGastos];
      goalsChart.data.datasets[1].data = [metaReceitas, metaGastos];
      goalsChart.update();
    
//       Atualizar progresso das metas na interface
      updateGoalsProgress(totalReceitas, totalGastos, metaReceitas, metaGastos);
  }

 // Atualizar progresso das metas na interface
 function updateGoalsProgress(receitas, gastos, metaReceitas, metaGastos) {
     const progressContainer = document.getElementById('goals-progress');
     if (!progressContainer) return;
    
//      Calcular percentuais de progresso
     const receitasProgress = Math.min(Math.round((receitas / metaReceitas) * 100), 100);
     const gastosProgress = Math.min(Math.round((gastos / metaGastos) * 100), 100);
    
//      Determinar status das metas
     const receitasStatus = receitas >= metaReceitas ? 'success' : 'warning';
     const gastosStatus = gastos <= metaGastos ? 'success' : 'danger';
    
//      Criar HTML para o progresso
     progressContainer.innerHTML = `
         <div class="mb-3">
             <div class="d-flex justify-content-between align-items-center mb-1">
                 <span>Meta de Receitas</span>
                 <span>${FinanceUtils.formatCurrency(receitas)} / ${FinanceUtils.formatCurrency(metaReceitas)}</span>
             </div>
             <div class="progress" style="height: 10px;">
                 <div class="progress-bar bg-${receitasStatus}" role="progressbar" 
                     style="width: ${receitasProgress}%" 
                     aria-valuenow="${receitasProgress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
             </div>
         </div>
        
         <div class="mb-3">
             <div class="d-flex justify-content-between align-items-center mb-1">
                 <span>Meta de Gastos</span>
                 <span>${FinanceUtils.formatCurrency(gastos)} / ${FinanceUtils.formatCurrency(metaGastos)}</span>
             </div>
             <div class="progress" style="height: 10px;">
                 <div class="progress-bar bg-${gastosStatus}" role="progressbar" 
                     style="width: ${gastosProgress}%" 
                     aria-valuenow="${gastosProgress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
             </div>
         </div>
        
         <div class="mt-4">
             <h6 class="text-muted mb-2">Recomendações</h6>
             <ul class="list-unstyled">
                 ${receitas < metaReceitas ? 
                     '<li><i class="bi bi-arrow-up-circle text-success me-2"></i>Aumente suas receitas em ' + 
                     FinanceUtils.formatCurrency(metaReceitas - receitas) + '</li>' : 
                     '<li><i class="bi bi-check-circle text-success me-2"></i>Meta de receitas atingida!</li>'
                 }
                
                 ${gastos > metaGastos ? 
                     '<li><i class="bi bi-arrow-down-circle text-danger me-2"></i>Reduza seus gastos em ' + 
                     FinanceUtils.formatCurrency(gastos - metaGastos) + '</li>' : 
                     '<li><i class="bi bi-check-circle text-success me-2"></i>Meta de gastos atingida!</li>'
                 }
             </ul>
         </div>
     `;
 }

// Atualizar tabela de transações
 function updateTransactionsTable(data) {
     const tableBody = document.getElementById('transactions-table-body');
     if (!tableBody || !data.success) return;
    
//      Limpar tabela
     tableBody.innerHTML = '';
    
     if (!data.transactions || data.transactions.length === 0) {
         tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma transação encontrada</td></tr>';
         return;
     }
    
//      Adicionar cada transação à tabela
     data.transactions.forEach(transaction => {
         const row = document.createElement('tr');
        
//          Definir classe baseada no tipo de transação (entrada/saída)
         if (transaction.valor < 0) {
             row.classList.add('table-danger');  //Saída (vermelho)
         } else {
             row.classList.add('table-success');  //Entrada (verde)
         }
        
         row.innerHTML = `
             <td>${transaction.data}</td>
             <td>${transaction.descricao}</td>
             <td>${transaction.modelo || 'N/A'}</td>
             <td class="text-${transaction.valor < 0 ? 'danger' : 'success'}">${FinanceUtils.formatCurrency(transaction.valor)}</td>
             <td>${FinanceUtils.formatCurrency(transaction.saldo)}</td>
             <td>
                 <button class="btn btn-sm btn-outline-primary edit-transaction" data-id="${transaction.id}">
                     <i class="bi bi-pencil"></i>
                 </button>
                 <button class="btn btn-sm btn-outline-danger delete-transaction" data-id="${transaction.id}">
                     <i class="bi bi-trash"></i>
                 </button>
             </td>
         `;
        
         tableBody.appendChild(row);
     });
        
     // Atualizar contador de transações
     const countInfo = document.getElementById('transactions-count-info');
     if (countInfo) {
         countInfo.textContent = `Exibindo ${data.transactions.length} de ${data.total || data.transactions.length} transações`;
     }
 }

 // Atualizar resumo de transações
 function updateTransactionSummary(data) {
     if (!data.success || !data.transactions) return;
    
     const totalElement = document.getElementById('total-value');
     const incomeElement = document.getElementById('income-value');
     const expenseElement = document.getElementById('expense-value');
     const countElement = document.getElementById('transaction-count');
    
     if (!totalElement || !incomeElement || !expenseElement || !countElement) return;
    
     let income = 0;
     let expense = 0;
    
     data.transactions.forEach(transaction => {
         if (transaction.valor >= 0) {
             income += transaction.valor;
         } else {
             expense += Math.abs(transaction.valor);
         }
     });
    
     const total = income - expense;
    
     totalElement.textContent = FinanceUtils.formatCurrency(total);
     totalElement.className = total >= 0 ? 'text-success' : 'text-danger';
    
     incomeElement.textContent = FinanceUtils.formatCurrency(income);
     expenseElement.textContent = FinanceUtils.formatCurrency(expense);
     countElement.textContent = data.transactions.length;
 }

// Gerar insights com base nos dados
function generateInsights(saldoData, gastosData, categoriasData) {
    const insightsContainer = document.getElementById('insights-container');
    if (!insightsContainer) return;

    // Clear previous insights
    insightsContainer.innerHTML = '';

    // Validate data
    if (!saldoData?.success || !gastosData?.success || !categoriasData?.success) {
        insightsContainer.innerHTML = '<div class="alert alert-info">Dados insuficientes para gerar insights.</div>';
        return;
    }

    const insights = [];

    // Calculate total expenses
    const totalGastos = Object.values(gastosData.gastosPorData)
        .reduce((total, data) => total + data.valor, 0);

    // Calculate total income (difference in balance + expenses)
    const saldos = Object.entries(saldoData.saldoPorDia)
        .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')));
    
    const saldoInicial = saldos[0]?.[1].valor || 0;
    const saldoFinal = saldos[saldos.length - 1]?.[1].valor || 0;
    const variacaoSaldo = saldoFinal - saldoInicial;

    // Add insights based on the data
    if (variacaoSaldo > 0) {
        insights.push({
            icon: 'bi-graph-up-arrow',
            title: 'Saldo Positivo',
            description: `Seu saldo aumentou em R$ ${Math.abs(variacaoSaldo).toFixed(2)} no período`,
            type: 'success'
        });
    } else if (variacaoSaldo < 0) {
        insights.push({
            icon: 'bi-graph-down-arrow',
            title: 'Saldo em Queda',
            description: `Seu saldo diminuiu em R$ ${Math.abs(variacaoSaldo).toFixed(2)} no período`,
            type: 'danger'
        });
    }

    // Add expense categories insights
    const categorias = Object.entries(categoriasData.valoresPorCategoria)
        .map(([categoria, data]) => ({ categoria, valor: data.valor }))
        .sort((a, b) => b.valor - a.valor);

    if (categorias.length > 0) {
        insights.push({
            icon: 'bi-tag',
            title: 'Maior Gasto por Categoria',
            description: `${categorias[0].categoria}: R$ ${categorias[0].valor.toFixed(2)}`,
            type: 'warning'
        });
    }

    // Render insights
    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = `insight-item mb-3 ${insight.type}`;
        insightElement.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="insight-icon me-3">
                    <i class="bi ${insight.icon} fs-4"></i>
                </div>
                <div>
                    <h6 class="mb-1">${insight.title}</h6>
                    <p class="mb-0 small">${insight.description}</p>
                </div>
            </div>
        `;
        insightsContainer.appendChild(insightElement);
    });
}


// Configurar formulário de filtro
// function setupFilterForm() {
//     const filterForm = document.getElementById('filter-form');
//     if (!filterForm) return;
    
//     filterForm.addEventListener('submit', function(e) {
//         e.preventDefault();
        
//         // Atualizar filtros
//         const startDate = document.getElementById('start-date');
//         const endDate = document.getElementById('end-date');
//         const category = document.getElementById('filter-category');
//         const type = document.getElementById('filter-type');
        
//         currentFilters = {
//             startDate: startDate ? startDate.value : null,
//             endDate: endDate ? endDate.value : null,
//             category: category ? category.value : '',
//             type: type ? type.value : ''
//         };
        
//         // Recarregar dados
//         loadAllChartData();
//     });
// }

// // Configurar botões de ação
// function setupActionButtons() {
//     // Botão para adicionar transação
//     const addTransactionBtn = document.getElementById('add-transaction');
//     if (addTransactionBtn) {
//         addTransactionBtn.addEventListener('click', function() {
//             // Abrir modal para adicionar transação
//             const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
//             modal.show();
//         });
//     }
    
//     // Botão para importar CSV
//     const importCsvBtn = document.getElementById('import-csv');
//     if (importCsvBtn) {
//         importCsvBtn.addEventListener('click', function() {
//             // Abrir modal para importar CSV
//             const modal = new bootstrap.Modal(document.getElementById('importCsvModal'));
//             modal.show();
//         });
//     }
    
       
//     // Botão para importar arquivo CSV
//     const importFileBtn = document.getElementById('import-file');
//     if (importFileBtn) {
//         importFileBtn.addEventListener('click', function() {
//             const fileInput = document.getElementById('csv-file');
//             if (fileInput.files.length > 0) {
//                 importCsvFile(fileInput.files[0]);
//             } else {
//                 FinanceUtils.showAlert('Selecione um arquivo CSV para importar.', 'warning');
//             }
//         });
//     }
// }


// // Importar arquivo CSV
// async function importCsvFile(file) {
//     if (!file) return;
    
//     const formData = new FormData();
//     formData.append('csvFile', file);
    
//     try {
//         // Mostrar indicador de carregamento
//         const importStatus = document.getElementById('import-status');
//         if (importStatus) {
//             importStatus.innerHTML = '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div> Importando...';
//         }
        
//         // Enviar arquivo para o servidor
//         const response = await fetch('/api/importar-csv', {
//             method: 'POST',
//             body: formData
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Erro ao importar CSV: ${errorText}`);
//         }
        
//         const result = await response.json();
        
//         if (result.success) {
//             // Atualizar status
//             if (importStatus) {
//                 importStatus.innerHTML = `<i class="bi bi-check-circle text-success me-2"></i> Importação concluída: ${result.imported} transações importadas.`;
//             }
            
//             // Fechar modal após 2 segundos
//             setTimeout(() => {
//                 const modal = bootstrap.Modal.getInstance(document.getElementById('importCsvModal'));
//                 if (modal) modal.hide();
                
//                 // Limpar formulário
//                 const fileInput = document.getElementById('csv-file');
//                 if (fileInput) fileInput.value = '';
                
//                 // Mostrar mensagem de sucesso
//                 FinanceUtils.showAlert(`Importação concluída: ${result.imported} transações importadas.`, 'success');
                
//                 // Recarregar dados
//                 loadAllChartData();
//             }, 2000);
//         } else {
//             throw new Error(result.message || 'Erro ao importar CSV');
//         }
//     } catch (error) {
//         console.error('Erro ao importar CSV:', error);
        
//         // Atualizar status
//         const importStatus = document.getElementById('import-status');
//         if (importStatus) {
//             importStatus.innerHTML = `<i class="bi bi-exclamation-triangle text-danger me-2"></i> ${error.message}`;
//         }
        
//         FinanceUtils.showAlert(`Erro ao importar CSV: ${error.message}`, 'danger');
//     }
// }

 // Carregar lista de categorias
 async function loadCategories() {
     try {
         const response = await fetch('/api/categorias');
         const data = await response.json();
        
         if (data.success && data.categorias) {
//              Preencher selects de categoria
             const categorySelects = document.querySelectorAll('select[data-type="category-select"]');
            
             categorySelects.forEach(select => {
                 // Manter a opção padrão
                 const defaultOption = select.querySelector('option[value=""]');
                
                 // Limpar outras opções
                 select.innerHTML = '';
                
                 // Adicionar opção padrão de volta
                 if (defaultOption) {
                     select.appendChild(defaultOption);
                 }
                
                 // Adicionar categorias
                 data.categorias.forEach(category => {
                     const option = document.createElement('option');
                     option.value = category;
                     option.textContent = category;
                     select.appendChild(option);
                 });
             });
         }
     } catch (error) {
         console.error('Erro ao carregar categorias:', error);
     }
 }

// Adicionar estilos CSS para os insights
function addInsightStyles() {
    if (!document.getElementById('insight-styles')) {
        const style = document.createElement('style');
        style.id = 'insight-styles';
        style.textContent = `
            .insight-item {
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                transition: all 0.3s ease;
                border-left: 4px solid transparent;
            }
            
            .insight-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .insight-item.success {
                background-color: rgba(75, 192, 192, 0.1);
                border-left-color: rgba(75, 192, 192, 0.7);
            }
            
            .insight-item.warning {
                background-color: rgba(255, 206, 86, 0.1);
                border-left-color: rgba(255, 206, 86, 0.7);
            }
            
            .insight-item.danger {
                background-color: rgba(255, 99, 132, 0.1);
                border-left-color: rgba(255, 99, 132, 0.7);
            }
            
            .insight-item.info {
                background-color: rgba(54, 162, 235, 0.1);
                border-left-color: rgba(54, 162, 235, 0.7);
            }
            
            .insight-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: rgba(255, 255, 255, 0.8);
            }
            
            .insight-item.success .insight-icon {
                color: rgba(75, 192, 192, 1);
            }
            
            .insight-item.warning .insight-icon {
                color: rgba(255, 206, 86, 1);
            }
            
            .insight-item.danger .insight-icon {
                color: rgba(255, 99, 132, 1);
            }
            
            .insight-item.info .insight-icon {
                color: rgba(54, 162, 235, 1);
            }
            
            .chart-container {
                position: relative;
                height: 300px;
                margin-bottom: 20px;
            }
            
            @media (max-width: 768px) {
                .chart-container {
                    height: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos CSS
    addInsightStyles();
    
    // Configurar datas padrão
    //setupDefaultDates();
    
    // Inicializar gráficos
    initCharts();
    
    // Configurar formulário de filtro
    //setupFilterForm();
    
    // Configurar botões de ação
    //setupActionButtons();
    
    // Carregar lista de categorias
    loadCategories();
    
    // Carregar dados iniciais
    loadAllChartData();
    
    // Adicionar listener para redimensionamento da janela
    window.addEventListener('resize', function() {
        // Usar debounce para evitar chamadas excessivas durante o redimensionamento
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(function() {
            // Reinicializar gráficos para ajustar ao novo tamanho
            initCharts();
            loadAllChartData();
        }, 250);
    });
});
