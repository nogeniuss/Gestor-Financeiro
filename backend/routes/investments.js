// backend/routes/investments.js
import fs from 'fs';
import path from 'path';

// Usando import.meta.url para calcular o diretório atual
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const investmentsFile = path.join(__dirname, '../models/investments.json');

function handleInvestments(req, res) {
    if (req.method === 'GET') {
        fs.readFile(investmentsFile, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ message: 'Erro no servidor' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const newInvestment = JSON.parse(body);
            fs.readFile(investmentsFile, (err, data) => {
                let investments = JSON.parse(data);
                investments.push(newInvestment);
                fs.writeFile(investmentsFile, JSON.stringify(investments, null, 2), (err) => {
                    res.writeHead(201);
                    res.end(JSON.stringify({ message: 'Investimento adicionado' }));
                });
            });
        });
    }
}

export { handleInvestments };
