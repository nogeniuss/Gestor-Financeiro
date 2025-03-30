// convertService.js
const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const multer = require('multer');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../dao/extrato_inter_csv')); 
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// Função para garantir que o diretório existe antes de salvar o arquivo
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Função para converter CSV para JSON
async function convertCsvToJson(csvFilePath) {
  console.log(`Tentando converter ${csvFilePath} para JSON...`);

  try {
    const outputDir = path.join(__dirname, '../../dao/extrato_inter_json');
    ensureDirectoryExistence(outputDir);

    const fileName = path.basename(csvFilePath, path.extname(csvFilePath));
    const jsonFilePath = path.join(outputDir, `${fileName}.json`);

    // Lê o conteúdo do arquivo CSV
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Encontra a linha que contém os cabeçalhos
    const lines = fileContent.split('\n');
    let headerLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Data Lançamento') && lines[i].includes('Histórico') && 
          lines[i].includes('Descrição') && lines[i].includes('Valor') && lines[i].includes('Saldo')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      throw new Error('Cabeçalhos não encontrados no arquivo CSV');
    }
    
    // Extrai os dados relevantes (cabeçalho + linhas de dados)
    const relevantData = lines.slice(headerLineIndex).join('\n');
    
    // Escreve os dados relevantes em um arquivo temporário
    const tempFilePath = path.join(outputDir, `temp_${fileName}.csv`);
    fs.writeFileSync(tempFilePath, relevantData);
    
    // Converte o arquivo CSV para JSON usando a biblioteca csvtojson
    const jsonArray = await csv({
      delimiter: ';' // Define o delimitador como ponto e vírgula
    }).fromFile(tempFilePath);
    
    // Remove o arquivo temporário
    fs.unlinkSync(tempFilePath);

    if (!jsonArray || jsonArray.length === 0) {
      throw new Error('O arquivo CSV não contém dados válidos.');
    }

    // Processar os dados conforme a estrutura desejada
    const formattedData = jsonArray.map(item => {
      // Verificando e tratando valores
      const valor = item['Valor'] ? parseFloat(item['Valor'].replace('.', '').replace(',', '.')) : 0;
      const saldo = item['Saldo'] ? parseFloat(item['Saldo'].replace('.', '').replace(',', '.')) : 0;

      return {
        data: item['Data Lançamento'] || '',
        descricao: item['Descrição'] || '',
        modelo: item['Histórico'] || '',
        valor: valor,
        saldo: saldo
      };
    });

    // Salva o JSON gerado
    fs.writeFileSync(jsonFilePath, JSON.stringify(formattedData, null, 2));

    console.log(`✅ Arquivo convertido com sucesso: ${jsonFilePath}`);
    return jsonFilePath;
  } catch (error) {
    console.error(`❌ Erro ao converter o arquivo ${csvFilePath}:`, error.message);
    return null;
  }
}

// Função que verifica os arquivos CSV e os converte
function checkAndConvert() {
  const csvDirectory = path.join(__dirname, '../../dao/extrato_inter_csv');
  ensureDirectoryExistence(csvDirectory);
  
  const files = fs.readdirSync(csvDirectory);
  const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');

  csvFiles.forEach(file => {
    const filePath = path.join(csvDirectory, file);
    convertCsvToJson(filePath);
  });
}

module.exports = {
  convertCsvToJson,
  checkAndConvert,
  upload
};
