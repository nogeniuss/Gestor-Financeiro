import dotenv from 'dotenv';  // Importando corretamente o dotenv

// Exporta as variáveis para facilitar o acesso em outras partes da aplicação
module.exports = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  PORT: process.env.PORT || 3000, // Define a porta do servidor
};
