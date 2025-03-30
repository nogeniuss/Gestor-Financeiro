// Configurações globais para os gráficos
Chart.defaults.font.family = "'Poppins', 'Helvetica', 'Arial', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';

// Armazena referências aos gráficos para atualizações posteriores
let dashboardCharts = {};

// Armazena dados financeiros carregados
let dashboardData = {};

// Cores para os gráficos
const chartColors = {
  primary: 'rgba(13, 110, 253, 0.7)',
  primaryBorder: 'rgba(13, 110, 253, 1)',
  success: 'rgba(25, 135, 84, 0.7)',
  successBorder: 'rgba(25, 135, 84, 1)',
  danger: 'rgba(220, 53, 69, 0.7)',
  dangerBorder: 'rgba(220, 53, 69, 1)',
  warning: 'rgba(255, 193, 7, 0.7)',
  warningBorder: 'rgba(255, 193, 7, 1)',
  info: 'rgba(13, 202, 240, 0.7)',
  infoBorder: 'rgba(13, 202, 240, 1)',
  dark: 'rgba(33, 37, 41, 0.7)',
  darkBorder: 'rgba(33, 37, 41, 1)',
  categoryColors: [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 199, 199, 0.7)'
  ]
};

/**
 * Inicialização do dashboard quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado, inicializando dashboard...');
  
  if (document.getElementById('dashboard-container')) {
    initializeDashboard();
    
    // Adiciona eventos aos botões
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const refreshBtn = document.getElementById('btn-refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', refreshDashboard);
    }
    
    const uploadPageBtn = document.getElementById('page-upload');
    if (uploadPageBtn) {
      uploadPageBtn.addEventListener('click', () => {
        window.location.href = '/upload';
      });
    }
    
    // Carrega as categorias disponíveis para o filtro
    loadCategories();
  }
});

/**
 * Inicializa o dashboard carregando os dados financeiros
 */
async function initializeDashboard() {
  console.log('Inicializando o dashboard...');
  showLoading(true);
  
  try {
    const response = await fetch('/api/resumo-financeiro');
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      dashboardData = data.resumo;
      
      // Atualiza as datas do período se existirem
      if (dashboardData.periodoExtrato) {
        updatePeriodDates(dashboardData.periodoExtrato);
      }
      
      // Atualiza os cards informativos
      updateFinancialCards();
      
      // Inicializa os gráficos
      initializeCharts();
      
      // Carrega a tabela de transações recentes
      loadRecentTransactions();
    } else {
      throw new Error(data.message || 'Erro desconhecido ao carregar dados');
    }
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
    showAlert('Falha ao carregar o dashboard: ' + error.message, 'danger');
  } finally {
    showLoading(false);
  }
}

/**
 * Atualiza as datas do período nos elementos da interface
 * @param {Object} periodo - Objeto contendo dataInicial e dataFinal
 */
function updatePeriodDates(periodo) {
  // Atualiza os textos de data
  const firstDateEl = document.getElementById('firstDate');
  const lastDateEl = document.getElementById('lastDate');
  
  if (firstDateEl && periodo.dataInicial) {
    firstDateEl.textContent = `Início: ${periodo.dataInicial || '--/--/----'}`;
  }
  
  if (lastDateEl && periodo.dataFinal) {
    lastDateEl.textContent = `Fim: ${periodo.dataFinal || '--/--/----'}`;
  }
  
  // Define as datas nos inputs de filtro
  const dataInicioEl = document.getElementById('dataInicio');
  const dataFimEl = document.getElementById('dataFim');
  
  if (dataInicioEl && periodo.dataInicial) {
    dataInicioEl.value = convertDateFormat(periodo.dataInicial);
  }
  
  if (dataFimEl && periodo.dataFinal) {
    dataFimEl.value = convertDateFormat(periodo.dataFinal);
  }
}

/**
 * Converte data do formato dd/mm/yyyy para yyyy-mm-dd (formato HTML input)
 * @param {string} dateString - Data no formato dd/mm/yyyy
 * @returns {string} Data no formato yyyy-mm-dd
 */
function convertDateFormat(dateString) {
  if (!dateString) return '';
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return dateString;
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Carrega as categorias disponíveis para o filtro
 */
async function loadCategories() {
  try {
    console.log('Carregando categorias...');
    const response = await fetch('/api/categorias');
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar categorias: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Categorias recebidas:', data);
    
    const selectElement = document.getElementById('categoria-select');
    if (!selectElement) {
      console.warn('Elemento select para categorias não encontrado');
      return;
    }
    
    // Limpar opções existentes
    selectElement.innerHTML = '<option value="">Todas as categorias</option>';
    
    // Adicionar novas opções
    if (data.success && data.categorias && Array.isArray(data.categorias)) {
      data.categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.name;
        option.textContent = categoria.name;
        selectElement.appendChild(option);
      });
    } else {
      console.warn('Formato de dados de categorias inválido:', data);
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    showAlert('Não foi possível carregar as categorias', 'warning');
  }
}

/**
 * Aplica os filtros selecionados e atualiza os dados do dashboard
 */
async function applyFilters() {
  console.log('Aplicando filtros...');
  
  const dataInicio = document.getElementById('dataInicio')?.value || '';
  const dataFim = document.getElementById('dataFim')?.value || '';
  const categoria = document.getElementById('categoria-select')?.value || '';
  
  console.log('Filtros selecionados:', { dataInicio, dataFim, categoria });
  
  // Valida as datas
  if (dataInicio && dataFim) {
    if (new Date(dataInicio) > new Date(dataFim)) {
      showAlert('A data de início deve ser anterior à data de fim', 'warning');
      return;
    }
  }
  
  showLoading(true);
  
  try {
    // Formata as datas para o formato dd/mm/yyyy
    const formatarDataAPI = (dataStr) => {
      if (!dataStr) return '';
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };
    
    // Prepara os parâmetros para a API
    const params = {
      categoria: categoria,
      dataInicio: dataInicio ? formatarDataAPI(dataInicio) : '',
      dataFim: dataFim ? formatarDataAPI(dataFim) : ''
    };
    
    console.log('Enviando requisição para a API com os parâmetros:', params);
    
    const response = await fetch('/api/filtrar-transacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dados recebidos da API:', data);
    
    if (data.success) {
      // Exibe as transações filtradas
      displayRecentTransactions(data.transacoes);
      
      // Atualiza os gráficos com os dados filtrados
      if (data.resumo) {
        updateChartsWithFilteredData(data.resumo);
        showAlert('Filtros aplicados com sucesso', 'success');
      } else {
        console.warn('Dados de resumo não encontrados na resposta');
        showAlert('Filtros aplicados, mas sem dados de resumo', 'warning');
      }
    } else {
      throw new Error(data.message || 'Erro desconhecido ao aplicar filtros');
    }
  } catch (error) {
    console.error('Erro ao aplicar filtros:', error);
    showAlert('Falha ao aplicar filtros: ' + error.message, 'danger');
  } finally {
    showLoading(false);
  }
}

/**
 * Atualiza os gráficos com os dados filtrados
 * @param {Object} resumo - Dados de resumo financeiro
 */
function updateChartsWithFilteredData(resumo) {
  console.log('Atualizando gráficos com dados filtrados...');
  
  // Atualiza os dados do dashboard
  dashboardData = resumo;
  
  // Atualiza os cards informativos
  updateFinancialCards();
  
  // Atualiza os gráficos
  createExpensesByDateChart();
  createBalanceByDayChart();
  createExpensesByCategoryChart();
  createExpenseTrendChart();
}

/**
 * Atualiza os cards informativos com os dados financeiros
 */
function updateFinancialCards() {
  console.log('Atualizando cards informativos...');
  
  // Card de Saldo Atual
  if (dashboardData.saldoAtual) {
    updateCard('saldo-atual', {
      title: 'Saldo Atual',
      value: dashboardData.saldoAtual.valorFormatado || formatCurrency(dashboardData.saldoAtual.valor),
      icon: 'bi-wallet2',
      color: dashboardData.saldoAtual.valor >= 0 ? 'success' : 'danger'
    });
  }
  
  // Card de Total de Gastos
  if (dashboardData.totalGastos) {
    updateCard('total-gastos', {
      title: 'Total de Gastos',
      value: dashboardData.totalGastos.valorFormatado || formatCurrency(Math.abs(dashboardData.totalGastos.valor)),
      icon: 'bi-cash-stack',
      color: 'danger'
    });
  }
  
  // Calcula a categoria com maior gasto
  if (dashboardData.valorPorCategoria) {
    let maiorCategoria = '';
    let maiorValor = 0;
    
    for (const [categoria, valor] of Object.entries(dashboardData.valorPorCategoria)) {
      if (valor > maiorValor) {
        maiorValor = valor;
        maiorCategoria = categoria;
      }
    }
    
    // Card de Maior Categoria de Gasto
    updateCard('maior-categoria', {
      title: 'Maior Categoria',
      value: maiorCategoria,
      subvalue: formatCurrency(maiorValor),
      icon: 'bi-tag',
      color: 'warning'
    });
  }
  
  // Calcula o dia com maior gasto
  if (dashboardData.gastosPorData) {
    let diaMaiorGasto = '';
    let valorMaiorGasto = 0;
    
    for (const [data, valor] of Object.entries(dashboardData.gastosPorData)) {
      const valorAbs = Math.abs(valor);
      if (valorAbs > valorMaiorGasto) {
        valorMaiorGasto = valorAbs;
        diaMaiorGasto = data;
      }
    }
    
    // Card de Dia com Maior Gasto
    updateCard('dia-maior-gasto', {
      title: 'Dia com Maior Gasto',
      value: formatDate(diaMaiorGasto),
      subvalue: formatCurrency(valorMaiorGasto),
      icon: 'bi-calendar-event',
      color: 'info'
    });
  }
}
function updateCard(id, data) {
    const card = document.getElementById(id);
    if (!card) return;
    
    const titleEl = card.querySelector('.card-title');
    const valueEl = card.querySelector('.card-value');
    const subvalueEl = card.querySelector('.card-subvalue');
    const iconEl = card.querySelector('.card-icon i');
    
    if (titleEl) titleEl.textContent = data.title;
    if (valueEl) valueEl.textContent = data.value;
    if (subvalueEl && data.subvalue) subvalueEl.textContent = data.subvalue;
    
    if (iconEl) {
      iconEl.className = '';
      iconEl.classList.add('bi', data.icon);
    }
    
    // Atualiza a cor do card
    card.className = card.className.replace(/bg-\w+/, '');
    card.classList.add(`bg-${data.color}-subtle`);
    
    if (iconEl) {
      iconEl.parentElement.className = iconEl.parentElement.className.replace(/bg-\w+/, '');
      iconEl.parentElement.classList.add(`bg-${data.color}`);
    }
  }
  
  /**
   * Inicializa todos os gráficos do dashboard
   */
  function initializeCharts() {
    console.log('Inicializando gráficos...');
    
    // Gráfico de Gastos por Data
    createExpensesByDateChart();
    
    // Gráfico de Saldo por Dia
    createBalanceByDayChart();
    
    // Gráfico de Gastos por Categoria
    createExpensesByCategoryChart();
    
    // Gráfico de Tendência de Gastos
    createExpenseTrendChart();
  }
  
  /**
   * Cria o gráfico de gastos por data
   */
  function createExpensesByDateChart() {
    console.log('Criando gráfico de gastos por data...');
    const ctx = document.getElementById('chart-expenses-by-date')?.getContext('2d');
    if (!ctx) return;
    
    // Prepara os dados
    const dados = dashboardData.gastosPorData || {};
    const labels = Object.keys(dados).sort();
    const valores = labels.map(data => Math.abs(dados[data])); // Valores positivos para o gráfico
    
    // Destrói o gráfico anterior se existir
    if (dashboardCharts.expensesByDate) {
      dashboardCharts.expensesByDate.destroy();
    }
    
    // Cria o novo gráfico
    dashboardCharts.expensesByDate = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(formatDate),
        datasets: [{
          label: 'Gastos por Data',
          data: valores,
          backgroundColor: chartColors.danger,
          borderColor: chartColors.dangerBorder,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value, false);
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Cria o gráfico de saldo por dia
   */
  function createBalanceByDayChart() {
    console.log('Criando gráfico de saldo por dia...');
    const ctx = document.getElementById('chart-balance-by-day')?.getContext('2d');
    if (!ctx) return;
    
    // Prepara os dados
    const dados = dashboardData.saldoPorDia || {};
    const labels = Object.keys(dados).sort();
    const valores = labels.map(data => dados[data]);
    
    // Destrói o gráfico anterior se existir
    if (dashboardCharts.balanceByDay) {
      dashboardCharts.balanceByDay.destroy();
    }
    
    // Cria o novo gráfico
    dashboardCharts.balanceByDay = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(formatDate),
        datasets: [{
          label: 'Saldo por Dia',
          data: valores,
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
          tension: 0.2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) {
                return formatCurrency(value, false);
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Cria o gráfico de gastos por categoria
   */
  function createExpensesByCategoryChart() {
    console.log('Criando gráfico de gastos por categoria...');
    const ctx = document.getElementById('chart-expenses-by-category')?.getContext('2d');
    if (!ctx) return;
    
    // Prepara os dados
    const dados = dashboardData.valorPorCategoria || {};
    const labels = Object.keys(dados);
    const valores = labels.map(categoria => dados[categoria]);
    
    // Destrói o gráfico anterior se existir
    if (dashboardCharts.expensesByCategory) {
      dashboardCharts.expensesByCategory.destroy();
    }
    
    // Cria o novo gráfico
    dashboardCharts.expensesByCategory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: chartColors.categoryColors,
          borderColor: chartColors.categoryColors.map(color => color.replace('0.7', '1')),
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
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const valor = context.raw;
                const total = valores.reduce((a, b) => a + b, 0);
                const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${formatCurrency(valor)} (${percentual}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Cria o gráfico de tendência de gastos
   */
  function createExpenseTrendChart() {
    console.log('Criando gráfico de tendência de gastos...');
    const ctx = document.getElementById('chart-expense-trend')?.getContext('2d');
    if (!ctx) return;
    
    // Prepara os dados
    const dados = dashboardData.gastosPorData || {};
    const datas = Object.keys(dados).sort();
    
    // Obtém os últimos 14 dias
    const ultimos14Dias = datas.slice(-14);
    const ultimos7Dias = ultimos14Dias.slice(-7);
    const dias7Anteriores = ultimos14Dias.slice(0, 7);
    
    // Calcula os gastos para cada período
    const gastosUltimos7 = ultimos7Dias.map(data => Math.abs(dados[data] || 0));
    const gastos7Anteriores = dias7Anteriores.map(data => Math.abs(dados[data] || 0));
    
    // Destrói o gráfico anterior se existir
    if (dashboardCharts.expenseTrend) {
      dashboardCharts.expenseTrend.destroy();
    }
    
    // Cria o novo gráfico
    dashboardCharts.expenseTrend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ultimos7Dias.map(formatDate),
        datasets: [
          {
            label: 'Últimos 7 dias',
            data: gastosUltimos7,
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primaryBorder,
            borderWidth: 1
          },
          {
            label: '7 dias anteriores',
            data: gastos7Anteriores,
            backgroundColor: chartColors.info,
            borderColor: chartColors.infoBorder,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value, false);
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Carrega as transações recentes
   */
  async function loadRecentTransactions() {
    console.log('Carregando transações recentes...');
    try {
      const response = await fetch('/api/transacoes-recentes?limite=10');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Exibe as transações na tabela
        displayRecentTransactions(data.transacoes);
      } else {
        throw new Error(data.message || 'Erro desconhecido ao carregar transações');
      }
    } catch (error) {
      console.error('Erro ao carregar transações recentes:', error);
      showAlert('Falha ao carregar transações recentes: ' + error.message, 'danger');
    }
  }
  
  /**
   * Exibe as transações recentes na tabela
   * @param {Array} transacoes - Lista de transações a serem exibidas
   */
  function displayRecentTransactions(transacoes) {
    console.log('Exibindo transações recentes...');
    const tableBody = document.getElementById('recent-transactions-table-body');
    if (!tableBody) return;
    
    // Limpa a tabela
    tableBody.innerHTML = '';
    
    if (!transacoes || transacoes.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" class="text-center">Nenhuma transação encontrada.</td>';
      tableBody.appendChild(tr);
      return;
    }
    
    // Adiciona as transações à tabela
    transacoes.forEach(transacao => {
      const tr = document.createElement('tr');
      
      // Determina a classe CSS com base no valor (positivo ou negativo)
      const valor = parseFloat(transacao.valor);
      const valorClass = valor < 0 ? 'text-danger' : 'text-success';
      
      // Formata a data se necessário
      const data = transacao.data.includes('T')
        ? new Date(transacao.data).toLocaleDateString('pt-BR')
        : transacao.data;
      
      tr.innerHTML = `
        <td>${data}</td>
        <td>${transacao.descricao}</td>
        <td class="${valorClass}">${transacao.valorFormatado || formatCurrency(valor)}</td>
        <td>${transacao.saldoFormatado || formatCurrency(transacao.saldo || 0)}</td>
      `;
      
      tableBody.appendChild(tr);
    });
  }
  
  /**
   * Formata um valor para moeda brasileira
   * @param {number} valor - Valor a ser formatado
   * @param {boolean} includeSymbol - Se deve incluir o símbolo da moeda
   * @returns {string} Valor formatado
   */
  function formatCurrency(valor, includeSymbol = true) {
    if (valor === undefined || valor === null) return '--';
    
    const options = {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };
    
    return new Intl.NumberFormat('pt-BR', options).format(valor);
  }
  
  /**
   * Formata uma data para o formato brasileiro
   * @param {string} dataStr - String de data a ser formatada
   * @returns {string} Data formatada
   */
  function formatDate(dataStr) {
    if (!dataStr) return '--';
    
    // Se a data já estiver no formato dd/mm/yyyy, retorna ela mesma
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
      return dataStr;
    }
    
    // Tenta converter a string para um objeto Date
    try {
      const data = new Date(dataStr);
      if (isNaN(data.getTime())) return dataStr; // Data inválida
      return data.toLocaleDateString('pt-BR');
    } catch (e) {
      return dataStr; // Retorna a string original em caso de erro
    }
  }
  
  /**
   * Formata uma data para o formato da API (yyyy-mm-dd)
   * @param {Date} data - Objeto Date a ser formatado
   * @returns {string} Data formatada
   */
  function formatDateForAPI(data) {
    if (!data || !(data instanceof Date)) return '';
    
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  }
  
  /**
   * Exibe ou oculta o indicador de carregamento
   * @param {boolean} show - Se deve mostrar ou ocultar o loader
   */
  function showLoading(show) {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
    
    // Também pode ocultar/mostrar o conteúdo do dashboard
    const content = document.getElementById('dashboard-content');
    if (content) {
      content.style.display = show ? 'none' : 'block';
    }
  }
  
  /**
   * Exibe um alerta na interface
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo do alerta (success, info, warning, danger)
   */
  function showAlert(message, type = 'info') {
    console.log(`Alerta ${type}: ${message}`);
    const alertContainer = document.getElementById('dashboard-alerts');
    if (!alertContainer) return;
    
    // Cria o elemento de alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Adiciona o alerta ao container
    alertContainer.appendChild(alert);
    
    // Remove o alerta após 5 segundos
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }
  
  /**
   * Atualiza o dashboard com os dados mais recentes
   */
  async function refreshDashboard() {
    console.log('Atualizando dashboard...');
    showLoading(true);
    
    try {
      const response = await fetch('/api/resumo-financeiro');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        dashboardData = data.resumo;
        
        // Atualiza os cards e gráficos
        updateFinancialCards();
        initializeCharts();
        loadRecentTransactions();
        
        showAlert('Dashboard atualizado com sucesso!', 'success');
      } else {
        throw new Error(data.message || 'Erro desconhecido ao atualizar dashboard');
      }
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      showAlert('Falha ao atualizar o dashboard: ' + error.message, 'danger');
    } finally {
      showLoading(false);
    }
  }
  
  // Exporta funções para uso global
  window.dashboardFunctions = {
    refresh: refreshDashboard,
    showAlert: showAlert,
    applyFilters: applyFilters
  };