const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const multer = require('multer');

// Configuração básica do Multer diretamente no arquivo
const upload = multer({
  dest: 'uploads/', // Pasta temporária para os uploads
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

/**
 * Converte um arquivo CSV para JSON
 * @param {string} filePath - Caminho do arquivo a ser convertido
 * @returns {string|null} - Caminho do arquivo JSON gerado ou null em caso de erro
 */
function convertCsvToJson(filePath) {
  console.log(`Tentando converter ${filePath} para JSON...`);
  
  try {
    // Criar diretório de saída se não existir
    const outputDir = path.join(__dirname, '..', '..', 'dao', 'extrato_inter_json');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const fileName = path.basename(filePath).split('.')[0]; // Remove a extensão
    const fileData = fs.readFileSync(filePath, 'utf8');

    // Separar linhas do arquivo manualmente
    const lines = fileData.split('\n').map(line => line.trim()).filter(line => line);

    // Encontrar índice da linha onde começam as transações (cabeçalho real)
    const headerIndex = lines.findIndex(line => 
      line.includes("Data Lançamento") && 
      line.includes("Histórico") && 
      line.includes("Descrição") && 
      line.includes("Valor") && 
      line.includes("Saldo"));

    if (headerIndex === -1) {
      console.log("Cabeçalho não encontrado no formato esperado");
      return null;
    }

    console.log(`Cabeçalho encontrado na linha ${headerIndex}`);
    
    // Extrair apenas as linhas a partir do cabeçalho (incluindo o cabeçalho)
    const relevantLines = lines.slice(headerIndex);
    
    // Processar as linhas manualmente para garantir o formato correto
    const extrato = [];
    
    // Pular a linha de cabeçalho
    for (let i = 1; i < relevantLines.length; i++) {
      const line = relevantLines[i];
      const parts = line.split(';');
      
      // Verificar se a linha tem o formato esperado
      if (parts.length >= 5) {
        const data = parts[0].trim();
        const historico = parts[1].trim();
        const descricao = parts[2].trim();
        const valor = parseFloat(parts[3].replace('.', '').replace(',', '.'));
        const saldo = parseFloat(parts[4].replace('.', '').replace(',', '.'));
        
        // Criar a descrição formatada conforme solicitado
        let descricaoFormatada = descricao;
        if (historico.includes('Pix recebido')) {
          descricaoFormatada = descricao.replace(/^(Pix recebido: |Pix enviado: |Compra no debito: |Compra: )/, '').trim();
        } else if (historico.includes('Pix enviado')) {
          descricaoFormatada = descricao.replace(/^(Pix recebido: |Pix enviado: |Compra no debito: |Compra: )/, '').trim();
        } else if (historico.includes('Compra')) {
          descricaoFormatada = descricao.replace(/^(Pix recebido: |Pix enviado: |Compra no debito: |Compra: )/, '').trim();
        }
        
        extrato.push({
          data,
          descricao: descricaoFormatada,
          valor,
          saldo_transacao: saldo
        });
      }
    }

    // Criar caminho do arquivo JSON de saída
    const outputPath = path.join(outputDir, `${fileName}.json`);

    // Salvar JSON formatado
    fs.writeFileSync(outputPath, JSON.stringify({ extrato }, null, 2));

    console.log(`✅ Arquivo convertido com sucesso: ${fileName}.json`);
    console.log(`Total de transações processadas: ${extrato.length}`);
    return outputPath; // Retorna o caminho do arquivo JSON gerado
  } catch (error) {
    console.error(`❌ Erro ao converter o arquivo ${filePath}:`, error.message);
    return null; // Retorna null em caso de erro
  } finally {
    // Limpar o arquivo temporário após processamento
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo temporário removido: ${filePath}`);
      }
    } catch (err) {
      console.error(`Erro ao remover arquivo temporário: ${err.message}`);
    }
  }
}

/**
 * Configura a rota de upload no aplicativo Express
 * @param {Object} app - Instância do aplicativo Express
 */
function setupUploadRoute(app) {
  app.post('/api/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    try {
      const filePath = req.file.path;
      
      // Tentar converter o arquivo
      const jsonPath = convertCsvToJson(filePath);
      
      if (jsonPath) {
        // Notificar o serviço financeiro para recarregar os dados
        try {
          const financialService = require('./financialService');
          if (typeof financialService.recarregarDados === 'function') {
            financialService.recarregarDados();
            console.log('Dados financeiros recarregados após upload');
          }
        } catch (err) {
          console.warn('Não foi possível recarregar os dados financeiros:', err.message);
        }
        
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
  
  console.log('Rota de upload configurada: /api/upload-csv');
}

// Adicionar o setupUploadRoute à exportação do módulo
module.exports = {
  convertCsvToJson,
  setupUploadRoute,
  upload
};
