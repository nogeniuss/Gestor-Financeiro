import https from 'https';
require('dotenv').config();

const API_URL = 'https://cdpj.partners.bancointer.com.br/banking/v2';

function getAccessToken(callback) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };

    const req = https.request(`${API_URL}/oauth/v2/token`, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { callback(JSON.parse(data)); });
    });

    req.write(`client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`);
    req.end();
}

function getAccountBalance(callback) {
    getAccessToken((tokenData) => {
        const options = {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        };

        const req = https.request(`${API_URL}/saldo`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { callback(JSON.parse(data)); });
        });

        req.end();
    });
}

module.exports = { getAccountBalance };
