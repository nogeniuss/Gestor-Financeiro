const fs = require('fs');
const path = require('path');
const listaExpressoes = require('./lista_expressoes_regulares');  // Importa as listas de expressões

// Diretório onde os arquivos JSON estão armazenados (na raiz do projeto)
const jsonDir = path.join(__dirname, '..', '..', 'dao', 'extrato_inter_json');
console.log("financialservice carregado")

function verificarCategoria(listaExpressoes, descricao) {
    // Se não houver descrição ou lista de expressões, retorna falso
    if (!descricao || !listaExpressoes) return false;
    
    // Se for uma única expressão regular
    if (listaExpressoes instanceof RegExp) {
      return listaExpressoes.test(descricao);
    }
    
    // Se for um array de expressões regulares
    if (Array.isArray(listaExpressoes)) {
      return listaExpressoes.some(expr => {
        if (expr instanceof RegExp) {
          return expr.test(descricao);
        } else if (typeof expr === 'string') {
          return descricao.toLowerCase().includes(expr.toLowerCase());
        }
        return false;
      });
    }
    
    // Se for uma string
    if (typeof listaExpressoes === 'string') {
      return descricao.toLowerCase().includes(listaExpressoes.toLowerCase());
    }
    
    return false;
  }
function saldoAtual(dataInicio, dataFim) {
    console.log('Calculando saldo atual...');
    
    // Inicializa o saldo inicial como 0
    let saldoInicial = 0;
    // Array para armazenar todas as transações
    let todasTransacoes = obterTodasTransacoes();
  
    try {
      // Ordena as transações por data (da mais antiga para a mais recente)
      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.data.split('/').reverse().join('-'));
        const dataB = new Date(b.data.split('/').reverse().join('-'));
        return dataA - dataB;
      });
      
      // Filtra as transações pelo período especificado
      if (dataInicio || dataFim) {
        todasTransacoes = todasTransacoes.filter(transacao => {
          // Converte a data da transação para objeto Date (formato DD/MM/YYYY para YYYY-MM-DD)
          const partes = transacao.data.split('/');
          const dataTransacao = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          
          // Verifica se está dentro do período
          if (dataInicio && dataFim) {
            return dataTransacao >= dataInicio && dataTransacao <= dataFim;
          } else if (dataInicio) {
            return dataTransacao >= dataInicio;
          } else if (dataFim) {
            return dataTransacao <= dataFim;
          }
          return true;
        });
      }
      
      // Calcula o saldo com base nas transações filtradas
      let saldoFinal = saldoInicial;
      todasTransacoes.forEach(transacao => {
        saldoFinal += transacao.valor || 0;
      });
      
      // Garante que o saldo não seja negativo
      saldoFinal = Math.max(0, saldoFinal);
      
      // Retorna o saldo com 2 casas decimais
      return parseFloat(saldoFinal.toFixed(2));
      
    } catch (err) {
      console.error('Erro ao calcular saldo atual:', err);
      return 0.00; // Retorna zero em caso de erro
    }
  }
function valorGastoPorData(dataInicio = null, dataFim = null) {
    console.log('Calculando valor gasto por data...');
    let result = {};
  
    try {
      // Obter todas as transações
      const todasTransacoes = obterTodasTransacoes();
      
      // Filtrar por período, se especificado
      let transacoesFiltradas = todasTransacoes;
      if (dataInicio || dataFim) {
        transacoesFiltradas = todasTransacoes.filter(transacao => {
          // Converte a data da transação para objeto Date (formato DD/MM/YYYY para YYYY-MM-DD)
          const partes = transacao.data.split('/');
          const dataTransacao = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          
          // Verifica se está dentro do período
          if (dataInicio && dataFim) {
            return dataTransacao >= dataInicio && dataTransacao <= dataFim;
          } else if (dataInicio) {
            return dataTransacao >= dataInicio;
          } else if (dataFim) {
            return dataTransacao <= dataFim;
          }
          return true;
        });
      }
      
      // Agrupar gastos por data
      transacoesFiltradas.forEach(transacao => {
        if (transacao.valor < 0) { // Só considera saídas (valor negativo)
          const data = transacao.data;
          if (!result[data]) result[data] = 0;
          result[data] += Math.abs(transacao.valor); // Converte para valor positivo para representar gastos
        }
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao calcular valor gasto por data:', error);
      return {};
    }
  }
function saldoTotalPorDia(dataInicio = null, dataFim = null) {
    console.log('Calculando saldo total por dia...');
    let result = {};
  
    try {
      // Obter todas as transações
      const todasTransacoes = obterTodasTransacoes();
      
      // Ordenar transações por data
      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.data.split('/').reverse().join('-'));
        const dataB = new Date(b.data.split('/').reverse().join('-'));
        return dataA - dataB;
      });
      
      // Filtrar por período, se especificado
      let transacoesFiltradas = todasTransacoes;
      if (dataInicio || dataFim) {
        transacoesFiltradas = todasTransacoes.filter(transacao => {
          // Converte a data da transação para objeto Date (formato DD/MM/YYYY para YYYY-MM-DD)
          const partes = transacao.data.split('/');
          const dataTransacao = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          
          // Verifica se está dentro do período
          if (dataInicio && dataFim) {
            return dataTransacao >= dataInicio && dataTransacao <= dataFim;
          } else if (dataInicio) {
            return dataTransacao >= dataInicio;
          } else if (dataFim) {
            return dataTransacao <= dataFim;
          }
          return true;
        });
      }
      
      // Calcular saldo acumulado por dia
      let saldoAcumulado = 0;
      
      // Agrupar transações por data
      const transacoesPorData = {};
      transacoesFiltradas.forEach(transacao => {
        const data = transacao.data;
        if (!transacoesPorData[data]) {
          transacoesPorData[data] = [];
        }
        transacoesPorData[data].push(transacao);
      });
      
      // Processar cada data em ordem cronológica
      const datasOrdenadas = Object.keys(transacoesPorData).sort((a, b) => {
        const dataA = new Date(a.split('/').reverse().join('-'));
        const dataB = new Date(b.split('/').reverse().join('-'));
        return dataA - dataB;
      });
      
      datasOrdenadas.forEach(data => {
        // Processar todas as transações do dia
        transacoesPorData[data].forEach(transacao => {
          saldoAcumulado += transacao.valor || 0;
        });
        
        // Garantir que o saldo não seja negativo
        saldoAcumulado = Math.max(0, saldoAcumulado);
        
        // Armazenar o saldo do dia
        result[data] = parseFloat(saldoAcumulado.toFixed(2));
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao calcular saldo total por dia:', error);
      return {};
    }
  }  
function valorPorCategoria(dataInicio = null, dataFim = null) {
    console.log('Calculando valor por categoria...');
    
    // Importar as expressões regulares com o caminho correto
    let listaExpressoes;
    try {
      console.log('Expressões regulares carregadas:', Object.keys(listaExpressoes));
    } catch (error) {
      console.error('Erro ao carregar expressões regulares:', error);
      listaExpressoes = {}; // Objeto vazio como fallback
    }
    
    let result = {
      'Uber': 0,
      'Alimentação': 0,
      'Apostas': 0,
      'Aluguel': 0,
      'Energia': 0, // Água e Luz
      'Dogs': 0,
      'Gás': 0,
      'Pix Recebido': 0,
      'Pix Enviado': 0,
      'Transferências': 0, // Nova categoria para transferências bancárias
      'Investimentos': 0,
      'Outras': 0
    };
  
    try {
      // Obter todas as transações
      const todasTransacoes = obterTodasTransacoes();
      
      // Filtrar por período, se especificado
      let transacoesFiltradas = todasTransacoes;
      if (dataInicio || dataFim) {
        transacoesFiltradas = todasTransacoes.filter(transacao => {
          // Converte a data da transação para objeto Date (formato DD/MM/YYYY para YYYY-MM-DD)
          const partes = transacao.data.split('/');
          const dataTransacao = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          
          // Verifica se está dentro do período
          if (dataInicio && dataFim) {
            return dataTransacao >= dataInicio && dataTransacao <= dataFim;
          } else if (dataInicio) {
            return dataTransacao >= dataInicio;
          } else if (dataFim) {
            return dataTransacao <= dataFim;
          }
          return true;
        });
      }
      
      // Processar cada transação
      transacoesFiltradas.forEach(transacao => {
        const descricao = transacao.descricao;
        const modelo = transacao.modelo;
        const valor = Math.abs(transacao.valor); // Sempre usamos o valor absoluto
        const ehDebito = transacao.valor < 0; // Se o valor é negativo, é uma saída (débito)
        
        // Verificar se é um Pix
        if (/pix/i.test(modelo)) {
          // Verificar se é Pix enviado ou recebido
          if (/recebido/i.test(modelo) || !ehDebito) {
            result['Pix Recebido'] += valor;
          } else {
            result['Pix Enviado'] += valor;
          }
          return; // Já categorizamos, podemos pular para a próxima transação
        }
        
        // Verificar se é uma transferência (não Pix)
        if (/transfer[eê]ncia/i.test(modelo) || /ted/i.test(modelo) || /doc/i.test(modelo)) {
          result['Transferências'] += valor;
          return; // Já categorizamos, podemos pular para a próxima transação
        }
        
        // Categorizar com base na descrição
        if (listaExpressoes.uber && verificarCategoria(listaExpressoes.uber, descricao)) {
          result['Uber'] += valor;
        } else if (listaExpressoes.alimentacao && verificarCategoria(listaExpressoes.alimentacao, descricao)) {
          result['Alimentação'] += valor;
        } else if (listaExpressoes.apostas && verificarCategoria(listaExpressoes.apostas, descricao)) {
          result['Apostas'] += valor;
        } else if (listaExpressoes.aluguel && verificarCategoria(listaExpressoes.aluguel, descricao)) {
          result['Aluguel'] += valor;
        } else if (listaExpressoes.agua && verificarCategoria(listaExpressoes.agua, descricao)) {
          result['Energia'] += valor;
        } else if (listaExpressoes.dogs && verificarCategoria(listaExpressoes.dogs, descricao)) {
          result['Dogs'] += valor;
        } else if (listaExpressoes.gas && verificarCategoria(listaExpressoes.gas, descricao)) {
          result['Gás'] += valor;
        } else if (listaExpressoes.investimentos && verificarCategoria(listaExpressoes.investimentos, descricao)) {
          result['Investimentos'] += valor;
        } else if (listaExpressoes.transferenciaPessoa && verificarCategoria(listaExpressoes.transferenciaPessoa, descricao)) {
          result['Transferências'] += valor;
        } else {
          // Verificar se é uma compra no débito e tentar categorizar
          if (/compra no débito/i.test(modelo) || /debito/i.test(modelo)) {
            if (/uber/i.test(descricao) || /99/i.test(descricao) || /taxi/i.test(descricao)) {
              result['Uber'] += valor;
            } else if (/mercado/i.test(descricao) || /super/i.test(descricao) || 
                      /aliment/i.test(descricao) || /rest/i.test(descricao) || 
                      /lanche/i.test(descricao) || /cafe/i.test(descricao) ||
                      /aqua magic/i.test(descricao)) {
              result['Alimentação'] += valor;
            } else {
              result['Outras'] += valor;
            }
          } else {
            result['Outras'] += valor;
          }
        }
      });
      
      // Formatar valores com 2 casas decimais
      Object.keys(result).forEach(key => {
        result[key] = parseFloat(result[key].toFixed(2));
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao calcular valor por categoria:', error);
      return {
        'Uber': 0,
        'Alimentação': 0,
        'Apostas': 0,
        'Aluguel': 0,
        'Energia': 0,
        'Dogs': 0,
        'Gás': 0,
        'Pix Recebido': 0,
        'Pix Enviado': 0,
        'Transferências': 0,
        'Investimentos': 0,
        'Outras': 0
      };
    }
  }
function convertStringToDate(dateString) {
    if (!dateString) return null;
    
    // Verifica o formato da data (dd/mm/yyyy)
    const parts = dateString.split('/');
    if (parts.length === 3) {
        // Formato dd/mm/yyyy
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-11
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    
    // Se não for no formato esperado, tenta converter diretamente
    return new Date(dateString);
  }
function filtroCategoriaData(categoria, dataInicio, dataFim) {
    console.log('Filtrando transações por categoria e intervalo de datas...');
    console.log('Parâmetros recebidos:', { categoria, dataInicio, dataFim });
  
    // Converter datas de string para objetos Date uma única vez
    const startDate = dataInicio ? convertStringToDate(dataInicio) : null;
    const endDate = dataFim ? convertStringToDate(dataFim) : null;
    
    if (startDate && endDate && startDate > endDate) {
      console.error('Data inicial é posterior à data final');
      return [];
    }
    
    // Carregar expressões regulares para categorização
    let listaExpressoes;
    try {
      listaExpressoes = require('./lista_expressoes_regulares');
      console.log('Expressões regulares carregadas:', Object.keys(listaExpressoes));
    } catch (error) {
      console.error('Erro ao carregar expressões regulares:', error);
      listaExpressoes = {};
    }
    
    // Verificar se o diretório existe
    if (!fs.existsSync(jsonDir)) {
      console.error(`Diretório não encontrado: ${jsonDir}`);
      return [];
    }
    
    // Obter lista de arquivos
    const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    console.log(`Encontrados ${files.length} arquivos JSON para processar`);
    
    if (files.length === 0) {
      console.warn('Nenhum arquivo JSON encontrado');
      return [];
    }
  
    let result = [];
  
    try {
      // Função auxiliar para determinar a categoria de uma transação
      function determinarCategoria(transacao) {
        const descricao = transacao.descricao || '';
        const modelo = transacao.modelo || '';
        const valor = transacao.valor || 0;
        const ehDebito = valor < 0;
        
        // Verificar se é um Pix
        if (/pix/i.test(modelo)) {
          return /recebido/i.test(modelo) || !ehDebito ? 'Pix Recebido' : 'Pix Enviado';
        }
        
        // Verificar se é uma transferência (não Pix)
        if (/transfer[eê]ncia/i.test(modelo) || /ted/i.test(modelo) || /doc/i.test(modelo)) {
          return 'Transferências';
        }
        
        // Mapeamento de verificações de categoria
        const categoriasMap = [
          { check: listaExpressoes.uber, name: 'Uber' },
          { check: listaExpressoes.alimentacao, name: 'Alimentação' },
          { check: listaExpressoes.apostas, name: 'Apostas' },
          { check: listaExpressoes.aluguel, name: 'Aluguel' },
          { check: listaExpressoes.agua, name: 'Energia' }, // Água e Luz agora são "Energia"
          { check: listaExpressoes.luz, name: 'Energia' },
          { check: listaExpressoes.dogs, name: 'Dogs' },
          { check: listaExpressoes.gas, name: 'Gás' },
          { check: listaExpressoes.investimentos, name: 'Investimentos' },
          { check: listaExpressoes.transferenciaPessoa, name: 'Transferências' }
        ];
        
        // Verificar cada categoria
        for (const cat of categoriasMap) {
          if (cat.check && verificarCategoria(cat.check, descricao)) {
            return cat.name;
          }
        }
        
        // Verificar se é uma compra no débito e tentar categorizar
        if (/compra no débito/i.test(modelo) || /debito/i.test(modelo)) {
          if (/uber/i.test(descricao) || /99/i.test(descricao) || /taxi/i.test(descricao)) {
            return 'Uber';
          } else if (/mercado/i.test(descricao) || /super/i.test(descricao) || 
                    /aliment/i.test(descricao) || /rest/i.test(descricao) || 
                    /lanche/i.test(descricao) || /cafe/i.test(descricao)) {
            return 'Alimentação';
          }
        }
        
        return 'Outras';
      }
      
      // Processar cada arquivo
      for (const file of files) {
        const filePath = path.join(jsonDir, file);
        console.log(`Processando arquivo: ${filePath}`);
        
        let fileData;
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          fileData = JSON.parse(fileContent);
        } catch (error) {
          console.error(`Erro ao ler/parsear arquivo ${file}:`, error);
          continue; // Pula para o próximo arquivo
        }
        
        // Verificar estrutura do arquivo
        const transacoes = fileData.extrato || fileData;
        if (!Array.isArray(transacoes)) {
          console.warn(`Arquivo ${file} não contém um array de transações válido`);
          continue;
        }
        
        console.log(`Arquivo contém ${transacoes.length} transações`);
        
        // Filtrar transações do arquivo
        const transacoesFiltradas = transacoes.filter(entry => {
          // Verificar se a transação tem dados válidos
          if (!entry || !entry.data) {
            console.warn('Transação com dados incompletos:', entry);
            return false;
          }
          
          // Filtrar por data
          if (startDate || endDate) {
            const entryDate = convertStringToDate(entry.data);
            
            if (!entryDate) {
              console.warn(`Data inválida na transação: ${entry.data}`);
              return false;
            }
            
            if (startDate && entryDate < startDate) {
              return false;
            }
            
            if (endDate && entryDate > endDate) {
              return false;
            }
          }
          
          // Filtrar por categoria
          if (categoria) {
            const categoriaTransacao = determinarCategoria(entry);
            return categoriaTransacao === categoria;
          }
          
          return true;
        });
        
        // Adicionar transações filtradas ao resultado
        result = result.concat(transacoesFiltradas);
      }
      
      console.log(`Total de transações após filtro: ${result.length}`);
      return result;
      
    } catch (error) {
      console.error('Erro ao processar o filtro de categoria e data:', error);
      throw new Error(`Erro ao processar os filtros: ${error.message}`);
    }
  }
function obterPeriodoExtrato() {
    console.log('Obtendo período do extrato...');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(jsonDir)) {
      console.error(`Diretório não encontrado: ${jsonDir}`);
      return { dataInicial: null, dataFinal: null };
    }
    
    const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    console.log(`Encontrados ${files.length} arquivos JSON para processar`);
    
    if (files.length === 0) {
      console.warn('Nenhum arquivo JSON encontrado');
      return { dataInicial: null, dataFinal: null };
    }
    
    let dataInicial = null;
    let dataFinal = null;
  
    try {
      for (const file of files) {
        const filePath = path.join(jsonDir, file);
        console.log(`Processando arquivo: ${filePath}`);
        
        let fileData;
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          fileData = JSON.parse(fileContent);
        } catch (error) {
          console.error(`Erro ao ler/parsear arquivo ${file}:`, error);
          continue; // Pula para o próximo arquivo
        }
        
        // Verificar estrutura do arquivo - aceita tanto data.extrato quanto um array direto
        const transacoes = fileData.extrato || (Array.isArray(fileData) ? fileData : null);
        if (!transacoes || !Array.isArray(transacoes) || transacoes.length === 0) {
          console.warn(`Arquivo ${file} não contém transações válidas`);
          continue;
        }
        
        // Processar cada transação
        for (const entry of transacoes) {
          if (!entry || !entry.data) {
            continue; // Pula transações sem data
          }
          
          const dataObj = convertStringToDate(entry.data);
          if (!dataObj || isNaN(dataObj.getTime())) {
            console.warn(`Data inválida na transação: ${entry.data}`);
            continue;
          }
          
          if (!dataInicial || dataObj < dataInicial) {
            dataInicial = dataObj;
          }
          
          if (!dataFinal || dataObj > dataFinal) {
            dataFinal = dataObj;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao obter período do extrato:', error);
    }
  
    // Formata as datas para o formato dd/mm/yyyy
    const formatarData = (data) => {
      if (!data) return null;
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };
  
    const resultado = {
      dataInicial: formatarData(dataInicial),
      dataFinal: formatarData(dataFinal)
    };
    
    console.log(`Período encontrado: ${resultado.dataInicial || 'N/A'} até ${resultado.dataFinal || 'N/A'}`);
    return resultado;
  }
function obterTransacoesRecentes(limite = 10) {
    console.log(`Obtendo ${limite} transações mais recentes...`);
    
    // Verificar se o diretório existe
    if (!fs.existsSync(jsonDir)) {
      console.error(`Diretório não encontrado: ${jsonDir}`);
      return [];
    }
    
    const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    console.log(`Encontrados ${files.length} arquivos JSON para processar`);
    
    if (files.length === 0) {
      console.warn('Nenhum arquivo JSON encontrado');
      return [];
    }
    
    let transacoes = [];
  
    try {
      // Processar cada arquivo
      for (const file of files) {
        const filePath = path.join(jsonDir, file);
        
        let fileData;
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          fileData = JSON.parse(fileContent);
        } catch (error) {
          console.error(`Erro ao ler/parsear arquivo ${file}:`, error);
          continue; // Pula para o próximo arquivo
        }
        
        // Verificar estrutura do arquivo - aceita tanto data.extrato quanto um array direto
        const fileTransacoes = fileData.extrato || (Array.isArray(fileData) ? fileData : null);
        if (!fileTransacoes || !Array.isArray(fileTransacoes)) {
          console.warn(`Arquivo ${file} não contém transações válidas`);
          continue;
        }
        
        // Filtrar transações com dados válidos
        const validTransacoes = fileTransacoes.filter(t => 
          t && t.data && (t.valor !== undefined || t.valor !== null)
        );
        
        transacoes = transacoes.concat(validTransacoes);
      }
      
      // Verificar se há transações
      if (transacoes.length === 0) {
        console.warn('Nenhuma transação válida encontrada');
        return [];
      }
      
      // Ordenar as transações por data (mais recente primeiro)
      transacoes.sort((a, b) => {
        const dataA = convertStringToDate(a.data);
        const dataB = convertStringToDate(b.data);
        
        // Verificar se as datas são válidas
        if (!dataA || !dataB) {
          return 0; // Manter a ordem se alguma data for inválida
        }
        
        return dataB - dataA;
      });
      
      // Limitar o número de transações
      transacoes = transacoes.slice(0, limite);
      
      // Formatar os valores
      transacoes = transacoes.map(transacao => {
        // Formatador de moeda
        const formatarMoeda = (valor) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(valor || 0);
        };
        
        return {
          ...transacao,
          valorFormatado: formatarMoeda(transacao.valor),
          // Verifica qual propriedade de saldo existe
          saldoFormatado: formatarMoeda(
            transacao.saldo_transacao !== undefined ? 
            transacao.saldo_transacao : transacao.saldo
          )
        };
      });
      
      console.log(`Retornando ${transacoes.length} transações recentes`);
      return transacoes;
      
    } catch (error) {
      console.error('Erro ao obter transações recentes:', error);
      return [];
    }
  }
function calcularResumoFinanceiro(transacoes = null) {
    console.log('Calculando resumo financeiro...');
    
    // Inicializa o objeto de resumo
    const resumo = {
      saldoAtual: { valor: 0, valorFormatado: 'R$ 0,00' },
      totalGastos: { valor: 0, valorFormatado: 'R$ 0,00' },
      gastosPorData: {},
      saldoPorDia: {},
      valorPorCategoria: {},
      periodoExtrato: { dataInicial: null, dataFinal: null }
    };
    
    // Se não foram fornecidas transações, lê todas dos arquivos
    if (!transacoes) {
      try {
        // Verificar se o diretório existe
        if (!fs.existsSync(jsonDir)) {
          console.error(`Diretório não encontrado: ${jsonDir}`);
          return resumo;
        }
        
        transacoes = [];
        const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
        console.log(`Encontrados ${files.length} arquivos JSON para processar`);
        
        if (files.length === 0) {
          console.warn('Nenhum arquivo JSON encontrado');
          return resumo;
        }
        
        // Processar cada arquivo
        for (const file of files) {
          const filePath = path.join(jsonDir, file);
          
          let fileData;
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            fileData = JSON.parse(fileContent);
          } catch (error) {
            console.error(`Erro ao ler/parsear arquivo ${file}:`, error);
            continue; // Pula para o próximo arquivo
          }
          
          // Verificar estrutura do arquivo - aceita tanto data.extrato quanto um array direto
          const fileTransacoes = fileData.extrato || (Array.isArray(fileData) ? fileData : null);
          if (!fileTransacoes || !Array.isArray(fileTransacoes)) {
            console.warn(`Arquivo ${file} não contém transações válidas`);
            continue;
          }
          
          // Filtrar transações com dados válidos
          const validTransacoes = fileTransacoes.filter(t => 
            t && t.data && (t.valor !== undefined || t.valor !== null)
          );
          
          transacoes = transacoes.concat(validTransacoes);
        }
      } catch (error) {
        console.error('Erro ao obter transações:', error);
        return resumo;
      }
    }
    
    // Se não houver transações, retorna o resumo vazio
    if (!transacoes || transacoes.length === 0) {
      console.warn('Nenhuma transação válida encontrada');
      return resumo;
    }
    
    console.log(`Processando ${transacoes.length} transações para o resumo financeiro`);
    
    // Função auxiliar para formatar valores monetários
    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor || 0);
    };
    
    // Função auxiliar para determinar a categoria de uma transação
    function determinarCategoria(transacao) {
      const descricao = transacao.descricao || '';
      const modelo = transacao.modelo || '';
      const valor = transacao.valor || 0;
      const ehDebito = valor < 0;
      
      // Verificar se é um Pix
      if (/pix/i.test(modelo)) {
        return /recebido/i.test(modelo) || !ehDebito ? 'Pix Recebido' : 'Pix Enviado';
      }
      
      // Verificar se é uma transferência (não Pix)
      if (/transfer[eê]ncia/i.test(modelo) || /ted/i.test(modelo) || /doc/i.test(modelo)) {
        return 'Transferências';
      }
      
      // Mapeamento de verificações de categoria
      const categoriasMap = [
        { check: listaExpressoes.uber, name: 'Uber' },
        { check: listaExpressoes.alimentacao, name: 'Alimentação' },
        { check: listaExpressoes.apostas, name: 'Apostas' },
        { check: listaExpressoes.aluguel, name: 'Aluguel' },
        { check: listaExpressoes.agua, name: 'Energia' }, // Água e Luz agora são "Energia"
        { check: listaExpressoes.luz, name: 'Energia' },
        { check: listaExpressoes.dogs, name: 'Dogs' },
        { check: listaExpressoes.gas, name: 'Gás' },
        { check: listaExpressoes.investimentos, name: 'Investimentos' },
        { check: listaExpressoes.transferenciaPessoa, name: 'Transferências' }
      ];
      
      // Verificar cada categoria
      for (const cat of categoriasMap) {
        if (cat.check && verificarCategoria(cat.check, descricao)) {
          return cat.name;
        }
      }
      
      // Verificar se é uma compra no débito e tentar categorizar
      if (/compra no débito/i.test(modelo) || /debito/i.test(modelo)) {
        if (/uber/i.test(descricao) || /99/i.test(descricao) || /taxi/i.test(descricao)) {
          return 'Uber';
        } else if (/mercado/i.test(descricao) || /super/i.test(descricao) || 
                  /aliment/i.test(descricao) || /rest/i.test(descricao) || 
                  /lanche/i.test(descricao) || /cafe/i.test(descricao)) {
          return 'Alimentação';
        }
      }
      
      return 'Outras';
    }
    
    // Ordenar transações por data (mais recente primeiro)
    transacoes.sort((a, b) => {
      const dataA = convertStringToDate(a.data);
      const dataB = convertStringToDate(b.data);
      
      if (!dataA || !dataB) return 0;
      return dataB - dataA;
    });
    
    // Pega o saldo da transação mais recente
    if (transacoes.length > 0) {
      // Verifica qual propriedade de saldo existe
      const saldoAtual = transacoes[0].saldo_transacao !== undefined ? 
                         transacoes[0].saldo_transacao : transacoes[0].saldo;
      
      resumo.saldoAtual.valor = parseFloat(saldoAtual || 0);
      resumo.saldoAtual.valorFormatado = formatarMoeda(resumo.saldoAtual.valor);
    }
    
    // Inicializa categorias no resumo
    const categorias = [
      'Uber', 'Alimentação', 'Apostas', 'Aluguel', 'Energia', 'Dogs', 'Gás',
      'Pix Recebido', 'Pix Enviado', 'Transferências', 'Investimentos', 'Outras'
    ];
    
    categorias.forEach(categoria => {
      resumo.valorPorCategoria[categoria] = 0;
    });
    
    // Calcula os gastos por data e categoriza transações
    let dataInicial = null;
    let dataFinal = null;
    
    transacoes.forEach(transacao => {
      // Verificar se a transação tem dados válidos
      if (!transacao.data || transacao.valor === undefined) {
        return; // Pula esta transação
      }
      
      const data = transacao.data;
      const valor = parseFloat(transacao.valor || 0);
      const dataObj = convertStringToDate(data);
      
      // Atualiza período do extrato
      if (dataObj) {
        if (!dataInicial || dataObj < dataInicial) {
          dataInicial = dataObj;
        }
        if (!dataFinal || dataObj > dataFinal) {
          dataFinal = dataObj;
        }
      }
      
      // Gastos por data (apenas valores negativos)
      if (valor < 0) {
        if (!resumo.gastosPorData[data]) resumo.gastosPorData[data] = 0;
        resumo.gastosPorData[data] += valor;
        
        // Acumula o total de gastos
        resumo.totalGastos.valor += Math.abs(valor);
      }
      
      // Saldo por dia
      const saldo = transacao.saldo_transacao !== undefined ? 
                    transacao.saldo_transacao : transacao.saldo;
      
      if (saldo !== undefined) {
        resumo.saldoPorDia[data] = parseFloat(saldo);
      }
      
      // Categoriza a transação
      const categoria = determinarCategoria(transacao);
      
      // Acumula o valor por categoria (valores absolutos para gastos)
      if (valor < 0) {
        resumo.valorPorCategoria[categoria] += Math.abs(valor);
      } else if (categoria === 'Pix Recebido' || categoria === 'Investimentos') {
        // Para categorias de receita, usamos o valor positivo
        resumo.valorPorCategoria[categoria] += valor;
      }
    });
    
    // Formata o total de gastos
    resumo.totalGastos.valorFormatado = formatarMoeda(resumo.totalGastos.valor);
    
    // Formata as datas para o formato dd/mm/yyyy
    const formatarData = (data) => {
      if (!data) return null;
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };
    
    resumo.periodoExtrato = {
      dataInicial: formatarData(dataInicial),
      dataFinal: formatarData(dataFinal)
    };
    
    console.log('Resumo financeiro calculado com sucesso');
    return resumo;
  }
function obterCategorias() {
    console.log("Obtendo categorias disponíveis...");
    
    // Categorias fixas que não dependem diretamente de expressões regulares
    const categoriasPadrao = [
      { id: 1, name: 'Pix Recebido' },
      { id: 2, name: 'Pix Enviado' },
      { id: 3, name: 'Transferências' },
      { id: 4, name: 'Outras' }
    ];
    
    try {
      // Carregar as expressões regulares
      let listaExpressoes;
      try {
        listaExpressoes = require('./lista_expressoes_regulares');
        console.log('Expressões regulares carregadas:', Object.keys(listaExpressoes));
      } catch (error) {
        console.error('Erro ao carregar expressões regulares:', error);
        // Se não conseguir carregar as expressões, retorna apenas as categorias padrão
        return categoriasPadrao;
      }
      
      // Mapeamento entre chaves de expressões regulares e nomes de categorias
      const mapeamentoExpressoes = [
        { chave: 'uber', nome: 'Uber' },
        { chave: 'alimentacao', nome: 'Alimentação' },
        { chave: 'apostas', nome: 'Apostas' },
        { chave: 'aluguel', nome: 'Aluguel' },
        { chave: 'agua', nome: 'Energia' }, // Água e Luz agora são "Energia"
        { chave: 'luz', nome: 'Energia' },  // Duplicado para manter consistência
        { chave: 'dogs', nome: 'Dogs' },
        { chave: 'gas', nome: 'Gás' },
        { chave: 'investimentos', nome: 'Investimentos' }
      ];
      
      // Conjunto para evitar duplicatas (como Energia que aparece duas vezes)
      const categoriasSet = new Set();
      
      // Adicionar categorias padrão ao conjunto
      categoriasPadrao.forEach(cat => categoriasSet.add(cat.name));
      
      // Adicionar categorias baseadas em expressões regulares
      mapeamentoExpressoes.forEach(mapa => {
        if (listaExpressoes[mapa.chave]) {
          categoriasSet.add(mapa.nome);
        }
      });
      
      // Converter o conjunto em um array de objetos com id e nome
      const categorias = Array.from(categoriasSet).map((nome, index) => {
        return { id: index + 1, name: nome };
      });
      
      console.log(`Retornando ${categorias.length} categorias`);
      return categorias;
      
    } catch (error) {
      console.error('Erro ao obter categorias:', error);
      return categoriasPadrao;
    }
  }
function obterResumoFinanceiro() {
    console.log("Obtendo resumo financeiro completo...");
    
    try {
      // Verificar se o diretório de dados existe
      if (!fs.existsSync(jsonDir)) {
        console.error(`Diretório de dados não encontrado: ${jsonDir}`);
        return {
          success: false,
          message: 'Diretório de dados não encontrado',
          error: `O diretório ${jsonDir} não existe`
        };
      }
      
      // Obter todas as transações uma única vez para evitar múltiplas leituras de arquivos
      const transacoes = obterTodasTransacoes();
      
      if (!transacoes || transacoes.length === 0) {
        console.warn('Nenhuma transação encontrada para gerar o resumo');
        return {
          success: true,
          resumo: {
            saldoAtual: { valor: 0, valorFormatado: 'R$ 0,00' },
            totalGastos: { valor: 0, valorFormatado: 'R$ 0,00' },
            gastosPorData: {},
            saldoPorDia: {},
            valorPorCategoria: {},
            periodoExtrato: { dataInicial: null, dataFinal: null },
            categorias: obterCategorias(),
            transacoesRecentes: []
          }
        };
      }
      
      console.log(`Processando ${transacoes.length} transações para o resumo financeiro`);
      
      // Calcula o resumo financeiro com as transações obtidas
      const resumo = calcularResumoFinanceiro(transacoes);
      
      // Adiciona informações adicionais
      resumo.categorias = obterCategorias();
      
      // Não precisamos chamar obterPeriodoExtrato() separadamente,
      // pois calcularResumoFinanceiro() já calcula o período
      
      // Adiciona as transações mais recentes ao resumo
      resumo.transacoesRecentes = obterTransacoesRecentes(transacoes, 5);
      
      console.log('Resumo financeiro gerado com sucesso');
      return {
        success: true,
        resumo: resumo
      };
      
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error);
      return {
        success: false,
        message: 'Erro ao obter resumo financeiro',
        error: error.message
      };
    }
  }
function obterTransacoesRecentes(transacoes, limite = 5) {
    console.log(`Obtendo ${limite} transações mais recentes do array...`);
    
    if (!transacoes || !Array.isArray(transacoes) || transacoes.length === 0) {
      console.warn('Array de transações vazio ou inválido');
      return [];
    }
    
    try {
      // Clonar o array para não modificar o original
      const transacoesClone = [...transacoes];
      
      // Ordenar as transações por data (mais recente primeiro)
      transacoesClone.sort((a, b) => {
        const dataA = convertStringToDate(a.data);
        const dataB = convertStringToDate(b.data);
        
        // Verificar se as datas são válidas
        if (!dataA || !dataB) {
          return 0; // Manter a ordem se alguma data for inválida
        }
        
        return dataB - dataA;
      });
      
      // Limitar o número de transações
      const transacoesRecentes = transacoesClone.slice(0, limite);
      
      // Formatador de moeda
      const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(valor || 0);
      };
      
      // Formatar os valores
      const transacoesFormatadas = transacoesRecentes.map(transacao => {
        return {
          ...transacao,
          valorFormatado: formatarMoeda(transacao.valor),
          // Verifica qual propriedade de saldo existe
          saldoFormatado: formatarMoeda(
            transacao.saldo_transacao !== undefined ? 
            transacao.saldo_transacao : transacao.saldo
          )
        };
      });
      
      console.log(`Retornando ${transacoesFormatadas.length} transações recentes`);
      return transacoesFormatadas;
      
    } catch (error) {
      console.error('Erro ao obter transações recentes do array:', error);
      return [];
    }
  }
function obterTodasTransacoes() {
    console.log('Obtendo todas as transações...');
    
    try {
      // Verificar se o diretório existe
      if (!fs.existsSync(jsonDir)) {
        console.error(`Diretório não encontrado: ${jsonDir}`);
        return [];
      }
      
      const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
      console.log(`Encontrados ${files.length} arquivos JSON para processar`);
      
      if (files.length === 0) {
        console.warn('Nenhum arquivo JSON encontrado');
        return [];
      }
      
      let todasTransacoes = [];
      
      // Processar cada arquivo
      for (const file of files) {
        const filePath = path.join(jsonDir, file);
        
        let fileData;
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          fileData = JSON.parse(fileContent);
        } catch (error) {
          console.error(`Erro ao ler/parsear arquivo ${file}:`, error);
          continue; // Pula para o próximo arquivo
        }
        
        // Verificar estrutura do arquivo - aceita tanto data.extrato quanto um array direto
        const fileTransacoes = fileData.extrato || (Array.isArray(fileData) ? fileData : null);
        if (!fileTransacoes || !Array.isArray(fileTransacoes)) {
          console.warn(`Arquivo ${file} não contém transações válidas`);
          continue;
        }
        
        // Filtrar transações com dados válidos
        const validTransacoes = fileTransacoes.filter(t => 
          t && t.data && (t.valor !== undefined || t.valor !== null)
        );
        
        todasTransacoes = todasTransacoes.concat(validTransacoes);
      }
      
      console.log(`Total de ${todasTransacoes.length} transações obtidas`);
      return todasTransacoes;
      
    } catch (error) {
      console.error('Erro ao obter todas as transações:', error);
      return [];
    }
  }

  module.exports = {
    // Funções de obtenção de dados básicos
    obterTodasTransacoes,                // Obtém todas as transações de todos os arquivos
    obterTransacoesRecentes,             // Obtém as transações mais recentes (nova versão)
    obterCategorias,                     // Obtém a lista de categorias disponíveis
    obterPeriodoExtrato,                 // Obtém o período coberto pelos extratos
    
    // Funções de cálculo e análise
    calcularResumoFinanceiro,            // Calcula o resumo financeiro completo
    saldoAtual,                          // Obtém o saldo atual da conta
    valorGastoPorData,                   // Calcula o valor gasto por data
    saldoTotalPorDia,                    // Calcula o saldo total por dia
    valorPorCategoria,                   // Calcula o valor por categoria
    filtroCategoriaData,                 // Filtra transações por categoria e data
    
    // Funções de resumo e agregação
    obterResumoFinanceiro,               // Obtém o resumo financeiro completo com informações adicionais
    
    // Funções obsoletas (mantidas para compatibilidade)
    getTransacoesRecentes: obterTransacoesRecentes  // Alias para compatibilidade com código existente
  };