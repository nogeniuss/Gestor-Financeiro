document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:3000/transactions")
        .then(res => res.json())
        .then(data => {
            let transactionHTML = "";
            data.forEach(t => {
                transactionHTML += `<tr>
                    <td>${t.data}</td>
                    <td>${t.descricao}</td>
                    <td>${t.valor.toFixed(2)}</td>
                    <td>${t.categoria}</td>
                </tr>`;
            });
            document.getElementById("transactions-list").innerHTML = transactionHTML;
        })
        .catch(err => console.error("Erro ao buscar transações:", err));

    fetch("http://localhost:3000/saldo")
        .then(res => res.json())
        .then(data => {
            document.getElementById("saldo").innerText = `R$ ${data.saldo.toFixed(2)}`;
        });
});
