/**
 * Gestor Financeiro - Script principal do frontend
 * Este arquivo contém todas as funções para interagir com a API e manipular a interface do usuário
 */

// Variáveis globais para armazenar dados e elementos do gráfico
let charts = {};
let dadosFinanceiros = {};

/**
 * Lógica de login para o sistema.
 * Esta função é responsável por capturar os dados do formulário de login, enviá-los ao backend
 * para validação e redirecionar o usuário ou exibir um erro, conforme o sucesso ou falha do login.
 * 
 * @function
 * @param {Event} event - O evento de submissão do formulário de login.
 * @returns {void} Não retorna nada diretamente. Em vez disso, redireciona o usuário ou exibe um alerta de erro.
 */
document.getElementById("loginForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Envia as credenciais para o backend
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = "/dashboard"; // Redireciona para a página de dashboard
        } else {
            // Exibe mensagem de erro
            alert("Credenciais inválidas. Tente novamente.");
        }
    })
    .catch(error => {
        console.error("Erro:", error);
        alert("Erro ao fazer login. Tente novamente.");
    });
});

/**
 * Inicializa o dashboard quando a página é carregada
 */
document.addEventListener("DOMContentLoaded", function() {
    // Verifica se estamos na página do dashboard
    if (document.getElementById("dashboard-container")) {
        inicializarDashboard();
    }
    
    // Configura o formulário de filtro de transações
    document.getElementById("filtroForm")?.addEventListener("submit", function(event) {
        event.preventDefault();
        filtrarTransacoes();
    });
});

/**
 * Inicializa o dashboard carregando todos os dados financeiros
 */
async function inicializarDashboard() {
    mostrarCarregando(true);
    
    try {
        // Carrega o resumo financeiro
        const response = await fetch("/api/resumo-financeiro");
        const data = await response.json();
        
        if (data.success) {
            dadosFinanceiros = data.resumo;
            
            // Atualiza os cards com informações financeiras
            atualizarCardSaldo(dadosFinanceiros.saldoAtual);
            atualizarCardGastos(dadosFinanceiros.totalGastos);
            
            // Inicializa os gráficos
            inicializarGraficos();
        } else {
            mostrarAlerta("Erro ao carregar dados financeiros: " + data.message, "danger");
        }
    } catch (error) {
        console.error("Erro ao inicializar dashboard:", error);
        mostrarAlerta("Erro ao carregar dashboard. Tente novamente mais tarde.", "danger");
    } finally {
        mostrarCarregando(false);
    }
}

/**
 * Atualiza o card de saldo atual
 * @param {Object} saldoAtual - Objeto contendo o valor e o valor formatado do saldo
 */
function atualizarCardSaldo(saldoAtual) {
    const cardSaldo = document.getElementById("card-saldo");
    if (cardSaldo) {
        cardSaldo.querySelector(".card-value").textContent = saldoAtual.valorFormatado;
        
        // Adiciona classe de cor baseada no valor do saldo
        if (saldoAtual.valor > 0) {
            cardSaldo.classList.add("positive");
            cardSaldo.classList.remove("negative");
        } else {
            cardSaldo.classList.add("negative");
            cardSaldo.classList.remove("positive");
        }
    }
}

/**
 * Atualiza o card de gastos totais
 * @param {Object} totalGastos - Objeto contendo o valor e o valor formatado dos gastos
 */
function atualizarCardGastos(totalGastos) {
    const cardGastos = document.getElementById("card-gastos");
    if (cardGastos) {
        cardGastos.querySelector(".card-value").textContent = totalGastos.valorFormatado;
    }
}

/**
 * Inicializa todos os gráficos do dashboard
 */
function inicializarGraficos() {
    // Inicializa o gráfico de gastos por data
    inicializarGraficoGastosPorData();
    
    // Inicializa o gráfico de saldo por dia
    inicializarGraficoSaldoPorDia();
    
    // Inicializa o gráfico de valor por categoria
    inicializarGraficoValorPorCategoria();
}

/**
 * Inicializa o gráfico de gastos por data
 */
function inicializarGraficoGastosPorData() {
    const ctx = document.getElementById("grafico-gastos-por-data")?.getContext("2d");
    if (!ctx) return;
    
    // Prepara os dados para o gráfico
    const dados = dadosFinanceiros.gastosPorData;
    const labels = Object.keys(dados).sort();
    const valores = labels.map(data => Math.abs(dados[data])); // Converte para valores positivos para o gráfico
    
    // Cria o gráfico
    charts.gastosPorData = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Gastos por Data",
                data: valores,
                backgroundColor: "rgba(255, 99, 132, 0.7)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return "R$ " + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "R$ " + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Inicializa o gráfico de saldo por dia
 */
function inicializarGraficoSaldoPorDia() {
    const ctx = document.getElementById("grafico-saldo-por-dia")?.getContext("2d");
    if (!ctx) return;
    
    // Prepara os dados para o gráfico
    const dados = dadosFinanceiros.saldoPorDia;
    const labels = Object.keys(dados).sort();
    const valores = labels.map(data => dados[data]);
    
    // Cria o gráfico
    charts.saldoPorDia = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Saldo por Dia",
                data: valores,
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return "R$ " + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "R$ " + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Inicializa o gráfico de valor por categoria
 */
function inicializarGraficoValorPorCategoria() {
    const ctx = document.getElementById("grafico-valor-por-categoria")?.getContext("2d");
    if (!ctx) return;
    
    // Prepara os dados para o gráfico
    const dados = dadosFinanceiros.valorPorCategoria;
    const labels = Object.keys(dados);
    const valores = labels.map(categoria => dados[categoria]);
    
    // Cores para as diferentes categorias
    const cores = [
        "rgba(255, 99, 132, 0.7)",
        "rgba(54, 162, 235, 0.7)",
        "rgba(255, 206, 86, 0.7)",
        "rgba(75, 192, 192, 0.7)",
        "rgba(153, 102, 255, 0.7)",
        "rgba(255, 159, 64, 0.7)",
        "rgba(199, 199, 199, 0.7)",
        "rgba(83, 102, 255, 0.7)",
        "rgba(40, 159, 64, 0.7)",
        "rgba(210, 199, 199, 0.7)"
    ];
    
    // Cria o gráfico
    charts.valorPorCategoria = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderColor: cores.map(cor => cor.replace("0.7", "1")),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "right"
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.raw;
                            const percentual = ((valor / valores.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: R$ ${valor.toFixed(2)} (${percentual}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Filtra transações por categoria e intervalo de datas
 */
async function filtrarTransacoes() {
    mostrarCarregando(true);
    
    try {
        const categoria = document.getElementById("categoria").value;
        const dataInicio = document.getElementById("dataInicio").value;
        const dataFim = document.getElementById("dataFim").value;
        
        // Valida os campos
        if (!categoria || !dataInicio || !dataFim) {
            mostrarAlerta("Preencha todos os campos do filtro", "warning");
            return;
        }
        
        // Envia a requisição para a API
        const response = await fetch("/api/filtrar-transacoes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ categoria, dataInicio, dataFim })
        });
        
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoFiltro(data.transacoes);
        } else {
            mostrarAlerta("Erro ao filtrar transações: " + data.message, "danger");
        }
    } catch (error) {
        console.error("Erro ao filtrar transações:", error);
        mostrarAlerta("Erro ao filtrar transações. Tente novamente.", "danger");
    } finally {
        mostrarCarregando(false);
    }
}

/**
 * Exibe o resultado do filtro de transações na tabela
 * @param {Array} transacoes - Array de transações filtradas
 */
function exibirResultadoFiltro(transacoes) {
    const tabelaResultado = document.getElementById("tabela-resultado");
    const tbody = tabelaResultado.querySelector("tbody");
    const resultadoContainer = document.getElementById("resultado-filtro");
    
    // Limpa a tabela
    tbody.innerHTML = "";
    
    if (transacoes.length === 0) {
        resultadoContainer.innerHTML = "<p class='text-center'>Nenhuma transação encontrada com os filtros aplicados.</p>";
        return;
    }
    
    // Preenche a tabela com as transações
    transacoes.forEach(transacao => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${transacao.data}</td>
            <td>${transacao.descricao}</td>
            <td class="${transacao.valor < 0 ? 'text-danger' : 'text-success'}">${transacao.valorFormatado}</td>
            <td>${transacao.saldoFormatado}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Exibe a tabela
    resultadoContainer.style.display = "block";
}

/**
 * Exibe ou oculta o indicador de carregamento
 * @param {boolean} mostrar - Se true, mostra o indicador; se false, oculta
 */
function mostrarCarregando(mostrar) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = mostrar ? "flex" : "none";
    }
}

/**
 * Exibe um alerta na interface
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo de alerta (success, danger, warning, info)
 */
function mostrarAlerta(mensagem, tipo = "info") {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) return;
    
    // Cria o elemento de alerta
    const alert = document.createElement("div");
    alert.className = `alert alert-${tipo} alert-dismissible fade show`;
    alert.role = "alert";
    alert.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Adiciona o alerta ao container
    alertContainer.appendChild(alert);
    
    // Remove o alerta após 5 segundos
    setTimeout(() => {
        alert.classList.remove("show");
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/**
 * Função para fazer logout
 */
function logout() {
    window.location.href = "/logout";
}

// Adiciona o evento de logout ao botão, se existir
document.getElementById("btn-logout")?.addEventListener("click", logout);
