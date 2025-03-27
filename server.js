require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const financialController = require('./src/controllers/financialController');
const convertService = require('./src/services/convertService');
const fs = require('fs');

// Inicializa o app Express
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configuração do body-parser
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Configuração de sessão
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para chamar o próximo middleware
 * @returns {void}
 * @throws {Error} - Erro ao configurar sessão
 * @throws {Error} - Erro ao salvar sessão
 */
app.use(session({
  secret: 'gestor-financeiro-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

/**
 * Middleware para verificar se o usuário está autenticado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para chamar o próximo middleware
 * @returns {void}
 * @throws {Error} - Erro ao verificar autenticação
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Rota de login
 * @route GET /login
 * @returns {void}
 * @throws {Error} - Erro ao acessar a página de login
 */
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/**
 * @route GET /dashboard
 * @access Private
 * @returns {void}
 * @throws {Error} - Erro ao acessar o dashboard
 */
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dash.html'));
});

/**
 * @route POST /login
 * @access Public
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Object} - Objeto com sucesso ou erro
 * @throws {Error} - Erro ao fazer login
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Tentativa de login:', { username, password });
  console.log('Valores esperados:', {
    NAMEUSER: process.env.NAMEUSER,
    PASSWORD: process.env.PASSWORD
  });
  // Usa as credenciais do arquivo .env
  if (username === process.env.NAMEUSER && password === process.env.PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    console.log('Login bem-sucedido para:', username);
    return res.json({ success: true });
  }
  console.log('Login falhou para:', username);
  res.json({ success: false, message: 'Credenciais inválidas' });
});

/**
 * Rota de logout
 * @route GET /logout
 * @returns {void}
 * @throws {Error} - Erro ao fazer logout
 */
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/api/saldo', isAuthenticated, financialController.getSaldo);
app.get('/api/gastos-por-data', isAuthenticated, financialController.getValorGastoPorData);
app.get('/api/saldo-por-dia', isAuthenticated, financialController.getSaldoPorDia);
app.get('/api/valor-por-categoria', isAuthenticated, financialController.getValorPorCategoria);

/**
 * Rota para obter o resumo financeiro
 * @name GET /api/resumo-financeiro
 * @param {string} req.query.dataInicio - Data de início do período (opcional)
 * @param {string} req.query.dataFim - Data de fim do período (opcional)
 * @returns {Object} - Objeto com o resumo financeiro
 * @throws {Error} - Erro ao obter resumo financeiro
 */
app.get('/api/resumo-financeiro', isAuthenticated, (req, res) => {
  const financialService = require('./src/services/financialService');
  const resultado = financialService.obterResumoFinanceiro();
  res.json(resultado);
});

// Rota para obter as categorias disponíveis
app.get('/api/categorias', isAuthenticated, financialController.getCategorias);

// Rota para filtrar transações
app.post('/api/filtrar-transacoes', isAuthenticated, (req, res) => {
  try {
    const { categoria, dataInicio, dataFim } = req.body;
    const financialService = require('./src/services/financialService');
    // Filtra as transações
    const transacoes = financialService.filtroCategoriaData(categoria, dataInicio, dataFim);
    // Calcula o resumo financeiro com base nas transações filtradas
    const resumo = financialService.calcularResumoFinanceiro(transacoes);
    res.json({
      success: true,
      transacoes: transacoes,
      resumo: resumo
    });
  } catch (error) {
    console.error('Erro ao filtrar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao filtrar transações',
      error: error.message
    });
  }
});

// Rota para transações recentes
app.get('/api/transacoes-recentes', (req, res) => {
  try {
    console.log('Rota /api/transacoes-recentes acessada');
    // Obter o limite da query string ou usar um valor padrão
    const limite = parseInt(req.query.limite) || 10;
    // Importar o serviço financeiro
    const financialService = require('./src/services/financialService');
    // Obter as transações mais recentes usando sua função existente
    const transacoes = financialService.getTransacoesRecentes(limite);
    // Retornar as transações
    res.json({
      success: true,
      transacoes: transacoes
    });
  } catch (error) {
    console.error('Erro ao obter transações recentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter transações recentes',
      error: error.message
    });
  }
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Rota para upload e conversão de CSV para JSON
app.post('/api/upload-csv', convertService.upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  try {
    const filePath = req.file.path;
    
    // Tentar converter o arquivo usando a função do convertService
    const jsonPath = convertService.convertCsvToJson(filePath);
    
    if (jsonPath) {
      res.json({ 
        success: true,
        message: 'Arquivo convertido com sucesso', 
        jsonPath,
        fileName: path.basename(jsonPath)
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Erro ao converter o arquivo.' 
      });
    }
  } catch (error) {
    console.error('Erro no processamento do upload:', error);
    res.status(500).json({ 
      success: false,
      error: `Erro no servidor: ${error.message}` 
    });
  }
});

/**
 * utilizamos o middleware para tratar erros
 * e retornar uma resposta JSON com o status 500 e uma mensagem de erro.
 */
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: err.message
  });
});

/**
 * Rota para lidar com rotas não encontradas
 */
app.use((req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log('Variáveis de ambiente carregadas:', {
    NAMEUSER: process.env.NAMEUSER ? 'Definido' : 'Não definido',
    PASSWORD: process.env.PASSWORD ? 'Definido' : 'Não definido'
  });
});
