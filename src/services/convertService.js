
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
