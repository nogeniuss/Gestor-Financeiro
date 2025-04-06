require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const financialController = require('./src/controllers/financialController');
const convertService = require('./src/services/convertService');
const financialService = require('./src/services/financialService');
const fs = require('fs');
const { upload, checkAndConvert } = require('./src/services/convertService'); // Importando as funções de convertService



// Inicializa o app Express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: 'gestor-financeiro-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/login');
};

app.get('/', (req, res) => {
  res.redirect('/login');
});

//rotas front-end

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login', 'login.html'));
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dash' ,'dash.html'));
});

app.get('/upload', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/upload', 'upload.html'));
});

app.get('/metas', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/metas', 'metas.html'));
});

app.get('/analise-ia', isAuthenticated ,(req, res) => {
res.sendFile(path.join(__dirname, 'public/ia', 'ai-analysis.html'));
});

app.get('/configuracoes', isAuthenticated, (req, res) => {
res.sendFile(path.join(__dirname, 'public/config', 'config.html'));
});

app.get('/transacoes', isAuthenticated, (req, res) => {
res.sendFile(path.join(__dirname, 'public/transacoes', 'transacoes.html'));
});

//rotas backend

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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/api/saldo', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    // Converte as strings de data para objetos Date, se fornecidas
    let dataInicioObj = dataInicio ? new Date(dataInicio) : null;
    let dataFimObj = dataFim ? new Date(dataFim) : null;
    
    // Se dataFim for fornecida, ajusta para o final do dia
    if (dataFimObj) {
      dataFimObj.setHours(23, 59, 59, 999);
    }
    
    // Se não foram fornecidas datas, determina o intervalo completo
    if (!dataInicioObj || !dataFimObj) {
      const todasTransacoes = financialService.obterTodasTransacoes();
      
      if (todasTransacoes.length > 0) {
        // Ordena transações por data
        todasTransacoes.sort((a, b) => {
          const dataA = new Date(a.data.split('/').reverse().join('-'));
          const dataB = new Date(b.data.split('/').reverse().join('-'));
          return dataA - dataB;
        });
        
        // Se dataInicio não foi fornecida, use a data da transação mais antiga
        if (!dataInicioObj) {
          const dataTransacaoMaisAntiga = todasTransacoes[0].data.split('/');
          dataInicioObj = new Date(`${dataTransacaoMaisAntiga[2]}-${dataTransacaoMaisAntiga[1]}-${dataTransacaoMaisAntiga[0]}`);
          dataInicioObj.setHours(0, 0, 0, 0); // Início do dia
        }
        
        // Se dataFim não foi fornecida, use a data da transação mais recente
        if (!dataFimObj) {
          const dataTransacaoMaisRecente = todasTransacoes[todasTransacoes.length - 1].data.split('/');
          dataFimObj = new Date(`${dataTransacaoMaisRecente[2]}-${dataTransacaoMaisRecente[1]}-${dataTransacaoMaisRecente[0]}`);
          dataFimObj.setHours(23, 59, 59, 999); // Final do dia
        }
      }
    }
    
    // Calcula o saldo para o período determinado
    const saldo = financialService.saldoAtual(dataInicioObj, dataFimObj);
    
    res.status(200).json({
      success: true,
      saldo: saldo,
      saldoFormatado: saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      periodo: {
        inicio: dataInicioObj ? dataInicioObj.toISOString().split('T')[0] : null,
        fim: dataFimObj ? dataFimObj.toISOString().split('T')[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter saldo',
      error: error.message
    });
  }
});
app.get('/api/gastos-por-data', isAuthenticated, financialController.getValorGastoPorData);

app.get('/api/saldo-por-dia', isAuthenticated, financialController.getSaldoPorDia);

app.get('/api/valores-por-categoria', isAuthenticated, financialController.getValorPorCategoria);

app.get('/api/resumo-financeiro', isAuthenticated, financialController.getResumoFinanceiro);

// Rota para obter as categorias
app.get('/api/categorias', isAuthenticated, financialController.getCategorias);

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
app.get('/api/transacoes-recentes', isAuthenticated, financialController.getTransacoesRecentes);

app.get('/api/periodo-extrato', isAuthenticated, financialController.getPeriodoExtrato);

app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
  }

  console.log(`📄 Arquivo recebido: ${req.file.path}`);

  try {
    // Chama a função de conversão para processar o arquivo CSV
    const jsonFilePath = await convertService.convertCsvToJson(req.file.path);

    if (jsonFilePath) {
      // Verifica e converte os arquivos CSV restantes na pasta (se necessário)
      await checkAndConvert();

      res.status(200).json({
        success: true,
        message: 'Arquivo convertido com sucesso!',
        jsonFilePath: jsonFilePath,
        fileName: path.basename(jsonFilePath)
      });
    } else {
      res.status(500).json({ success: false, message: 'Erro ao converter o arquivo.' });
    }
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error.message);
    res.status(500).json({ success: false, message: 'Erro ao processar o arquivo.' });
  }
});

app.get('/api/recent-uploads', async (req, res) => {
  try {
    const csvDirectory = path.join(__dirname, 'dao', 'extrato_inter_csv');
    const jsonDirectory = path.join(__dirname, 'dao', 'extrato_inter_json');
    
    // Verifica se os diretórios existem
    if (!fs.existsSync(csvDirectory)) {
      fs.mkdirSync(csvDirectory, { recursive: true });
    }
    
    if (!fs.existsSync(jsonDirectory)) {
      fs.mkdirSync(jsonDirectory, { recursive: true });
    }
    
    // Lista todos os arquivos CSV
    const csvFiles = fs.readdirSync(csvDirectory)
      .filter(file => path.extname(file).toLowerCase() === '.csv')
      .map(file => {
        const filePath = path.join(csvDirectory, file);
        const stats = fs.statSync(filePath);
        
        // Verifica se existe um JSON correspondente
        const baseName = path.basename(file, '.csv');
        const jsonExists = fs.existsSync(path.join(jsonDirectory, `${baseName}.json`));
        
        return {
          name: file,
          date: stats.mtime,
          status: jsonExists ? 'success' : 'pending'
        };
      });
    
    // Ordena por data (mais recente primeiro)
    csvFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(csvFiles);
  } catch (error) {
    console.error('Erro ao listar arquivos recentes:', error);
    res.status(500).json({ error: 'Falha ao listar arquivos recentes' });
  }
});





app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: err.message
  });
});

app.use((req, res) => {
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
