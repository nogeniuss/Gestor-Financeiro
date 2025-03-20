document.addEventListener("DOMContentLoaded", () => {
    const ctxPizza = document.getElementById("chart-pizza").getContext("2d");
    const ctxLinha = document.getElementById("chart-linha").getContext("2d");

    // Gráfico de Pizza (Receitas vs Despesas)
    const pizzaChart = new Chart(ctxPizza, {
        type: "pie",
        data: {
            labels: ["Receitas", "Despesas"],
            datasets: [{
                data: [60, 40], 
                backgroundColor: ["#28a745", "#dc3545"]
            }]
        }
    });

    // Gráfico de Linha (Saldo Mensal)
    const linhaChart = new Chart(ctxLinha, {
        type: "line",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr"],
            datasets: [{
                label: "Saldo Mensal",
                data: [1000, 1200, 1500, 1800],
                borderColor: "#007BFF",
                fill: false
            }]
        }
    });
});
