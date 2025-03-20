import http from 'http';
import { config } from 'dotenv';  // Corrigido para 'config'
import { handleTransactions } from './backend/routes/transactions.js';
import { handleGoals } from './backend/routes/goals.js';
import { handleInvestments } from './backend/routes/investments.js';

// Carregar variáveis de ambiente
config();

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);  // Uso de URL no lugar de 'url.parse'

    // Tratando as rotas
    if (parsedUrl.pathname.startsWith('/transactions')) {
        handleTransactions(req, res);
    } else if (parsedUrl.pathname.startsWith('/goals')) {
        handleGoals(req, res);
    } else if (parsedUrl.pathname.startsWith('/investments')) {
        handleInvestments(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Rota não encontrada' }));
    }
});

// Iniciando o servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
