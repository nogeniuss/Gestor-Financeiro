
// Variáveis globais para armazenar dados e elementos do gráfico
let charts = {};
let dadosFinanceiros = {};

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

function logout() {
    window.location.href = "/logout";
}

// Adiciona o evento de logout ao botão, se existir
document.getElementById("btn-logout")?.addEventListener("click", logout);
