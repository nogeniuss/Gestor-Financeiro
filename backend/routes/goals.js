// backend/routes/goals.js
import fs from 'fs';
import path from 'path';

// Usando import.meta.url para calcular o diretório atual
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const goalsFile = path.join(__dirname, '../models/goals.json');

function handleGoals(req, res) {
    if (req.method === 'GET') {
        fs.readFile(goalsFile, (err, data) => {
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
            const newGoal = JSON.parse(body);
            fs.readFile(goalsFile, (err, data) => {
                let goals = JSON.parse(data);
                goals.push(newGoal);
                fs.writeFile(goalsFile, JSON.stringify(goals, null, 2), (err) => {
                    res.writeHead(201);
                    res.end(JSON.stringify({ message: 'Meta adicionada' }));
                });
            });
        });
    }
}

export { handleGoals };
