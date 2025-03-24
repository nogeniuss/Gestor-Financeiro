/**
 * Gestor Financeiro - Dashboard
 * Este arquivo contém funções específicas para o dashboard financeiro,
 * incluindo gráficos, tabelas e visualizações de dados.
 */
console.log('Carregando o arquivo dashboard.js...');
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
 * Inicializa o dashboard quando o DOM estiver carregado
 */
console.log('Iniciando o dashboard...');
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dashboard-container')) {
        initializeDashboard();
        
        // Adiciona evento ao botão de filtrar
        document.getElementById('btn-filter')?.addEventListener('click', applyFilters);
        
        // Carrega as categorias disponíveis para o filtro
        loadCategories();
    }
});

/**
 * Inicializa o dashboard carregando os dados e configurando os gráficos
 */

async function initializeDashboard() {
    console.log('Inicializando o dashboard...');
    showLoading(true);
    try {
        // Carrega os dados do resumo financeiro
        const response = await fetch('/api/resumo-financeiro');
        const data = await response.json();
        if (data.success) {
            dashboardData = data.resumo;
            
            // Check if periodoExtrato exists before accessing properties
            if (dashboardData.periodoExtrato) {
                // Atualiza as datas do período
                document.getElementById('firstDate').textContent = `Início: ${dashboardData.periodoExtrato.dataInicial || '--/--/----'}`;
                document.getElementById('lastDate').textContent = `Fim: ${dashboardData.periodoExtrato.dataFinal || '--/--/----'}`;
                
                // Define as datas nos inputs de filtro
                if (dashboardData.periodoExtrato.dataInicial) {
                    const dataInicial = convertDateFormat(dashboardData.periodoExtrato.dataInicial);
                    document.getElementById('dataInicio').value = dataInicial;
                }
                
                if (dashboardData.periodoExtrato.dataFinal) {
                    const dataFinal = convertDateFormat(dashboardData.periodoExtrato.dataFinal);
                    document.getElementById('dataFim').value = dataFinal;
                }
            }
            
            // Atualiza os cards informativos
            updateFinancialCards();
            // Inicializa os gráficos
            initializeCharts();
            // Carrega a tabela de transações recentes
            loadRecentTransactions();
        } else {
            showAlert('Erro ao carregar dados do dashboard: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        showAlert('Falha ao carregar o dashboard. Verifique sua conexão.', 'danger');
    } finally {
        showLoading(false);
    }
}


/**
 * Converte data do formato dd/mm/yyyy para yyyy-mm-dd (para inputs date)
 */
function convertDateFormat(dateString) {
    console.log('Convertendo data de dd/mm/yyyy para yyyy-mm-dd');
    const parts = dateString.split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Carrega as categorias disponíveis para o filtro
 */
async function loadCategories() {
    console.log('Carregando categorias...');
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        
        if (data.success) {
            const categoriaSelect = document.getElementById('categoria');
            if (categoriaSelect) {
                // Limpa as opções existentes
                categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>';
                
                // Adiciona as categorias da lista de expressões
                data.categorias.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria;
                    option.textContent = categoria;
                    categoriaSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

/**
 * Aplica os filtros selecionados
 */
function applyFilters() {
    console.log('Aplicando filtros...');
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const categoria = document.getElementById('categoria').value;
    
    // Valida as datas
    if (dataInicio && dataFim) {
        if (new Date(dataInicio) > new Date(dataFim)) {
            showAlert('A data de início deve ser anterior à data de fim', 'warning');
            return;
        }
    }
    
    showLoading(true);
    
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
    
    // Faz a requisição para a API
    console.log('Enviando requisição para a API com os parâmetros:', params);
    fetch('/api/filtrar-transacoes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Exibe as transações filtradas
            displayRecentTransactions(data.transacoes);
            
            // Atualiza os gráficos com os dados filtrados
            updateChartsWithFilteredData(data.resumo);
            
            showAlert('Filtros aplicados com sucesso', 'success');
        } else {
            showAlert('Erro ao aplicar filtros: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Erro ao aplicar filtros:', error);
        showAlert('Falha ao aplicar filtros', 'danger');
    })
    .finally(() => {
        showLoading(false);
    });
}

/**
 * Atualiza os gráficos com os dados filtrados
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
    updateCard('saldo-atual', {
        title: 'Saldo Atual',
        value: dashboardData.saldoAtual.valorFormatado,
        icon: 'bi-wallet2',
        color: dashboardData.saldoAtual.valor >= 0 ? 'success' : 'danger'
    });
    // Calcula o total de gastos (valores negativos)
    const totalGastos = Math.abs(dashboardData.totalGastos.valor);
    // Card de Total de Gastos
    updateCard('total-gastos', {
        title: 'Total de Gastos',
        value: dashboardData.totalGastos.valorFormatado,
        icon: 'bi-cash-stack',
        color: 'danger'
    });
    // Calcula a categoria com maior gasto
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
    // Calcula o dia com maior gasto
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

/**
 * Atualiza um card informativo
 * @param {string} id - ID do elemento do card
 * @param {Object} data - Dados para atualizar o card
 */
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
    const dados = dashboardData.gastosPorData;
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
    const dados = dashboardData.saldoPorDia;
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
    const dados = dashboardData.valorPorCategoria;
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
                            const percentual = ((valor / valores.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(valor)} (${percentual}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Cria o gráfico de tendência de gastos (últimos 7 dias vs 7 dias anteriores)
 */
function createExpenseTrendChart() {
    console.log('Criando gráfico de tendência de gastos...');
    const ctx = document.getElementById('chart-expense-trend')?.getContext('2d');
    if (!ctx) return;
    // Prepara os dados
    const dados = dashboardData.gastosPorData;
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
 * Carrega as transações recentes para exibir na tabela
 */
async function loadRecentTransactions() {
    console.log('Carregando transações recentes...');
    try {
        // Faz a requisição para a API, incluindo token de autenticação se necessário
        const response = await fetch('/api/transacoes-recentes?limite=10');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        console.log('Resposta da API:', response);
        
        const data = await response.json();
        
        if (data.success) {
            // Exibe as transações na tabela
            displayRecentTransactions(data.transacoes);
        } else {
            console.error('Erro ao carregar transações recentes:', data.message);
            showAlert('Erro ao carregar transações recentes', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar transações recentes:', error);
        showAlert('Falha ao carregar transações recentes', 'danger');
    }
}

/**
 * Exibe as transações recentes na tabela
 * @param {Array} transacoes - Lista de transações para exibir
 */
function displayRecentTransactions(transacoes) {
    console.log('Exibindo transações recentes...');
    const tableBody = document.getElementById('recent-transactions-table-body');
    if (!tableBody) return;

    // Limpa a tabela
    tableBody.innerHTML = '';

    if (transacoes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" class="text-center">Nenhuma transação encontrada.</td>';
        tableBody.appendChild(tr);
        return;
    }

    // Função para formatar valores monetários
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

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
            <td class="${valorClass}">${transacao.valorFormatado || formatarMoeda(valor)}</td>
            <td>${transacao.saldoFormatado || formatarMoeda(transacao.saldo || 0)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Formata um valor monetário
 * @param {number} valor - Valor a ser formatado
 * @param {boolean} includeSymbol - Se deve incluir o símbolo da moeda
 * @returns {string} Valor formatado como moeda
 */
function formatCurrency(valor, includeSymbol = true) {
   console.log('Formatando valor:', valor);
    const options = {
        style: includeSymbol ? 'currency' : 'decimal',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    return new Intl.NumberFormat('pt-BR', options).format(valor);
}

/**
 * Formata uma data no formato dd/mm/yyyy
 * @param {string} dataStr - String de data no formato original
 * @returns {string} Data formatada
 */
function formatDate(dataStr) {
    console.log('Formatando data:', dataStr);
    if (!dataStr) return '';
    // Se a data já estiver no formato dd/mm/yyyy, retorna ela mesma
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        return dataStr;
    }
    // Tenta converter a string para um objeto Date
    try {
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR');
    } catch (e) {
        return dataStr; // Retorna a string original em caso de erro
    }
}

/**
 * Formata uma data para o formato aceito pela API (yyyy-mm-dd)
 * @param {Date} data - Objeto Date
 * @returns {string} Data formatada para API
 */
function formatDateForAPI(data) {
    console.log('Formatando data para API:', data);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

/**
 * Exibe ou oculta o indicador de carregamento
 * @param {boolean} show - Se true, mostra o indicador; se false, oculta
 */
function showLoading(show) {
    console.log('Exibindo/ocultando indicador de carregamento:', show);
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
 * @param {string} type - Tipo de alerta (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    console.log('Exibindo alerta:', message, 'do tipo', type);
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
 * Atualiza os dados do dashboard
 */
async function refreshDashboard() {
    console.log('Atualizando dashboard...');
    showLoading(true);
    try {
        const response = await fetch('/api/resumo-financeiro');
        const data = await response.json();
        if (data.success) {
            dashboardData = data.resumo;
            // Atualiza os cards e gráficos
            updateFinancialCards();
            initializeCharts();
            loadRecentTransactions();
            showAlert('Dashboard atualizado com sucesso!', 'success');
        } else {
            showAlert('Erro ao atualizar dashboard: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        showAlert('Falha ao atualizar o dashboard. Verifique sua conexão.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Adiciona evento ao botão de atualizar, se existir
document.getElementById('btn-refresh-dashboard')?.addEventListener('click', refreshDashboard);

// Exporta funções para uso global
window.dashboardFunctions = {
    refresh: refreshDashboard,
    showAlert: showAlert,
    applyFilters: applyFilters
};