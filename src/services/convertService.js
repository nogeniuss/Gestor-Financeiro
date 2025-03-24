/**
 * Módulo responsável pela conversão de arquivos CSV para JSON,
 * monitorando a pasta de entrada para novos arquivos e salvando
 * os arquivos convertidos em uma pasta de saída.
 * 
 * @module convertService
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const chokidar = require('chokidar');

// Diretórios de entrada e saída
const inputDir = path.join(__dirname,'dao', 'extrato_inter_csv');
const outputDir = path.join(__dirname,'dao', 'extrato_inter_json');

// Criar pasta de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Converte um arquivo CSV para JSON com a estrutura desejada.
 * 
 * A função lê o arquivo CSV, localiza a linha de cabeçalho correto, converte
 * as transações para um formato JSON e salva o resultado na pasta de saída.
 *
 * @function
 * @param {string} filePath - Caminho completo do arquivo CSV a ser convertido.
 * @throws {Error} Lança um erro se o cabeçalho das transações não for encontrado ou em caso de erro durante a conversão.
 * @returns {void} Não retorna nada. Salva o arquivo JSON convertido na pasta de saída.
 */
function convertCsvToJson(filePath) {
  console.log(`Convertendo ${filePath} para JSON...`);
  try {
    const fileName = path.basename(filePath, '.csv');
    const csvData = fs.readFileSync(filePath, 'utf8');

    // Separar linhas do CSV manualmente
    const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);

    // Encontrar índice da linha onde começam as transações (cabeçalho real)
    const headerIndex = lines.findIndex(line => line.startsWith("Data Lançamento;Descrição;Valor;Saldo"));

    if (headerIndex === -1) {
      throw new Error("Cabeçalho das transações não encontrado!");
    }

    // Extrair apenas as linhas a partir do cabeçalho real
    const csvContent = lines.slice(headerIndex).join('\n');

    // Converter CSV filtrado para JSON
    const result = Papa.parse(csvContent, {
      delimiter: ";",
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      trimHeaders: true
    });

    // Estruturar os dados corretamente
    const extrato = result.data.map(row => ({
      data: row["Data Lançamento"],
      descricao: row["Descrição"].replace(/^(Pix recebido: |Pix enviado: |Compra no debito: |Compra: )/, '').trim(),
      valor: parseFloat(String(row["Valor"]).replace(',', '.')),
      saldo_transacao: parseFloat(String(row["Saldo"]).replace(',', '.'))
    }));

    // Criar caminho do arquivo JSON de saída
    const outputPath = path.join(outputDir, `${fileName}.json`);

    // Salvar JSON formatado
    fs.writeFileSync(outputPath, JSON.stringify({ extrato }, null, 2));

    console.log(`✔ Arquivo convertido com sucesso: ${fileName}.csv → ${fileName}.json`);
  } catch (error) {
    console.error(`❌ Erro ao converter o arquivo ${filePath}:`, error.message);
  }
}

/**
 * Processa todos os arquivos CSV existentes na pasta de entrada e os converte para JSON.
 * 
 * A função lê o diretório de entrada e chama a função de conversão para cada arquivo CSV encontrado.
 *
 * @function
 * @param {string} inputDir - O diretório onde os arquivos CSV estão armazenados.
 * @returns {void} Não retorna nada. Processa os arquivos CSV na pasta de entrada.
 */
fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('❌ Erro ao ler o diretório:', err);
    return;
  }

  files.forEach(file => {
    if (path.extname(file).toLowerCase() === '.csv') {
      convertCsvToJson(path.join(inputDir, file));
    }
  });
});

/**
 * Monitoramento de novos arquivos CSV na pasta de entrada.
 * 
 * A função usa o chokidar para observar a pasta de entrada em tempo real. Quando um novo
 * arquivo CSV é adicionado, ele é automaticamente processado e convertido para JSON.
 *
 * @function
 * @param {string} inputDir - O diretório onde os arquivos CSV serão monitorados.
 * @returns {void} Não retorna nada. Apenas monitora a pasta para novos arquivos CSV.
 */
const watcher = chokidar.watch(inputDir, {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

console.log(`📂 Monitorando a pasta: ${inputDir}`);

watcher.on('add', filePath => {
  if (path.extname(filePath).toLowerCase() === '.csv') {
    console.log(`📥 Novo arquivo CSV detectado: ${path.basename(filePath)}`);
    convertCsvToJson(filePath);
  }
});
