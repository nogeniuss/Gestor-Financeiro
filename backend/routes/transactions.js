import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const transactionsFile = path.join(__dirname, '../models/transactions.json');

function handleTransactions(req, res) {
    if (req.method === 'GET') {
        console.log('Lendo arquivo transactions.json...');
        fs.readFile(transactionsFile, (err, data) => {
            if (err) {
                console.error('Erro ao ler o arquivo transactions.json:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ message: 'Erro no servidor' }));
                return;
            }
            console.log('Dados lidos com sucesso:', data.toString());
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const newTransaction = JSON.parse(body);
            console.log('Nova transação recebida:', newTransaction);
            fs.readFile(transactionsFile, (err, data) => {
                if (err) {
                    console.error('Erro ao ler o arquivo transactions.json durante o POST:', err);
                    res.writeHead(500);
                    res.end(JSON.stringify({ message: 'Erro no servidor' }));
                    return;
                }
                let transactions = JSON.parse(data);
                transactions.push(newTransaction);
                fs.writeFile(transactionsFile, JSON.stringify(transactions, null, 2), (err) => {
                    if (err) {
                        console.error('Erro ao escrever no arquivo transactions.json:', err);
                        res.writeHead(500);
                        res.end(JSON.stringify({ message: 'Erro no servidor' }));
                        return;
                    }
                    console.log('Transação adicionada com sucesso.');
                    res.writeHead(201);
                    res.end(JSON.stringify({ message: 'Transação adicionada' }));
                });
            });
        });
    }
}

export { handleTransactions };
