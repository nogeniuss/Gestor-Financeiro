const fs = require('fs');
const path = require('path');
const listaExpressoes = require('./lista_expressoes_regulares');  // Importa as listas de expressões

// Diretório onde os arquivos JSON estão armazenados (na raiz do projeto)
const jsonDir = path.join(__dirname, '..', '..', 'dao', 'extrato_inter_json');
console.log("financialservice carregado")

function saldoAtual() {
    console.log('Calculando saldo atual...');
    let saldo = 0;

    try {
        // Lê os arquivos do diretório de JSON
        const files = fs.readdirSync(jsonDir);
        files.forEach(file => {
            const filePath = path.join(jsonDir, file);
            if (filePath.endsWith('.json')) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                saldo += data.saldo_transacao || 0; // Adiciona o saldo do arquivo
            }
        });
    } catch (err) {
        console.error('Erro ao ler os arquivos JSON:', err);
    }

    // Retorna o saldo total com 2 casas decimais
    return saldo; // O saldo agora é retornado diretamente com precisão decimal
}

function valorGastoPorData() {
    console.log('Calculando valor gasto por data...');
    const files = fs.readdirSync(jsonDir);
    let result = {};

    files.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
        data.extrato.forEach(entry => {
            if (entry.valor < 0) { // Só considera saídas (valor negativo)
                const date = entry.data;
                if (!result[date]) result[date] = 0;
                result[date] += entry.valor; // Mantém o valor negativo
            }
        });
    });

    return result;
}

function saldoTotalPorDia() {
    console.log('Calculando saldo total por dia...');
    const files = fs.readdirSync(jsonDir);
    let result = {};

    files.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
        data.extrato.forEach(entry => {
            const date = entry.data;
            const saldoTransacao = parseFloat(entry.saldo_transacao); // Converte para float
            const valor = parseFloat(entry.valor); // O valor da transação

            // Verifica se ambos os valores (saldo_transacao e valor) são positivos e válidos
            if (valor > 0 && !isNaN(saldoTransacao) && saldoTransacao > 0) {
                if (!result[date]) result[date] = 0;

                // Somamos apenas os valores positivos de saldo
                result[date] += saldoTransacao;
            }
        });
    });

    return result;
}

function valorPorCategoria() {
    console.log('Calculando valor por categoria...');
    const files = fs.readdirSync(jsonDir);
    let result = {};

    files.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
        data.extrato.forEach(entry => {
            const descricao = entry.descricao;
            let categoria = '';

            // Categorias baseadas em expressões regulares mais abrangentes
            if (verificarCategoria(listaExpressoes.transferenciaPessoa, descricao)) {
                categoria = 'Transferência (Pessoa)';
            } else if (verificarCategoria(listaExpressoes.uber, descricao)) {
                categoria = 'Uber';
            } else if (verificarCategoria(listaExpressoes.alimentacao, descricao)) {
                categoria = 'Alimentação';
            } else if (verificarCategoria(listaExpressoes.apostas, descricao)) {
                categoria = 'Apostas';
            } else if (verificarCategoria(listaExpressoes.aluguel, descricao)) {
                categoria = 'Aluguel';
            } else if (verificarCategoria(listaExpressoes.agua, descricao)) {
                categoria = 'Água';
            } else if (verificarCategoria(listaExpressoes.luz, descricao)) {
                categoria = 'Luz';
            } else if (verificarCategoria(listaExpressoes.dogs, descricao)) {
                categoria = 'Dogs';
            } else if (verificarCategoria(listaExpressoes.gas, descricao)) {
                categoria = 'Gás';
            } else {
                categoria = 'Outras'; // Se não encontrar categoria específica
            }

            // Acumula o valor por categoria
            if (!result[categoria]) result[categoria] = 0;
            result[categoria] += Math.abs(entry.valor); // Considera sempre o valor absoluto
        });
    });

    return result;
}

function verificarCategoria(expressoes, descricao) {
    console.log('Verificando categoria para: ' + descricao);
    if (!expressoes || !descricao) return false;

    // Função para escapar caracteres especiais da expressão regular
    function escaparCaractereEspecial(termo) {
        return termo.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&"); // Escapa caracteres especiais
    }

    // Limpar as aspas duplas e outros caracteres não relevantes
    descricao = descricao.replace(/"/g, "").trim(); // Remover todas as aspas
    descricao = descricao.replace(/[^a-zA-Z0-9\s]/g, ""); // Remove caracteres especiais como -, : e outros

    for (const termo of expressoes) {
        const termoEscapado = escaparCaractereEspecial(termo); // Escapa o termo antes de criar a regex
        const regex = new RegExp(termoEscapado, 'i'); // Regex para procurar o termo insensível a maiúsculas
        if (regex.test(descricao)) {
            console.log('Categoria encontrada: ' + termo); // Colocando o log antes do return
            return true; // Encontrou uma correspondência
        }
    }
    console.log('Categoria não encontrada');
    return false; // Nenhuma correspondência foi encontrada
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
    
    const files = fs.readdirSync(jsonDir);
    console.log(`Encontrados ${files.length} arquivos para processar`);
    
    let result = [];
    
    try {
        // Itera sobre cada arquivo JSON
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(jsonDir, file);
                console.log(`Processando arquivo: ${filePath}`);
                
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Verifica cada entrada do extrato
                if (data.extrato && data.extrato.length > 0) {
                    console.log(`Arquivo contém ${data.extrato.length} transações`);
                    
                    data.extrato.forEach(entry => {
                        let incluirTransacao = true;
                        
                        // Filtra por data
                        if (dataInicio && dataFim) {
                            const entryDate = convertStringToDate(entry.data);
                            const startDate = convertStringToDate(dataInicio);
                            const endDate = convertStringToDate(dataFim);
                            
                            console.log(`Comparando datas: ${entry.data} (${entryDate}) com intervalo ${dataInicio} (${startDate}) - ${dataFim} (${endDate})`);
                            
                            if (entryDate < startDate || entryDate > endDate) {
                                incluirTransacao = false;
                                console.log(`Transação de ${entry.data} fora do intervalo de datas`);
                            }
                        }
                        
                        // Filtra por categoria
                        if (incluirTransacao && categoria) {
                            const descricao = entry.descricao;
                            let categoriaTransacao = '';
                            
                            // Determina a categoria da transação
                            if (verificarCategoria(listaExpressoes.transferenciaPessoa, descricao)) {
                                categoriaTransacao = 'Transferência (Pessoa)';
                            } else if (verificarCategoria(listaExpressoes.uber, descricao)) {
                                categoriaTransacao = 'Uber';
                            } else if (verificarCategoria(listaExpressoes.alimentacao, descricao)) {
                                categoriaTransacao = 'Alimentação';
                            } else if (verificarCategoria(listaExpressoes.apostas, descricao)) {
                                categoriaTransacao = 'Apostas';
                            } else if (verificarCategoria(listaExpressoes.aluguel, descricao)) {
                                categoriaTransacao = 'Aluguel';
                            } else if (verificarCategoria(listaExpressoes.agua, descricao)) {
                                categoriaTransacao = 'Água';
                            } else if (verificarCategoria(listaExpressoes.luz, descricao)) {
                                categoriaTransacao = 'Luz';
                            } else if (verificarCategoria(listaExpressoes.dogs, descricao)) {
                                categoriaTransacao = 'Dogs';
                            } else if (verificarCategoria(listaExpressoes.gas, descricao)) {
                                categoriaTransacao = 'Gás';
                            } else {
                                categoriaTransacao = 'Outras';
                            }
                            
                            console.log(`Categoria da transação: "${categoriaTransacao}", Categoria filtro: "${categoria}"`);
                            
                            if (categoriaTransacao !== categoria) {
                                incluirTransacao = false;
                                console.log(`Transação excluída por categoria diferente`);
                            }
                        }
                        
                        // Adiciona a transação ao resultado se passou pelos filtros
                        if (incluirTransacao) {
                            console.log(`Transação incluída no resultado: ${entry.data} - ${entry.descricao}`);
                            result.push(entry);
                        }
                    });
                }
            }
        });
        
        console.log(`Total de transações após filtro: ${result.length}`);
        return result;
    } catch (error) {
        console.error('Erro ao processar o filtro de categoria e data:', error);
        throw new Error('Erro ao processar os filtros');
    }
}


function obterPeriodoExtrato() {
    console.log('Obtendo período do extrato...');
    const files = fs.readdirSync(jsonDir);
    let dataInicial = null;
    let dataFinal = null;

    try {
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(jsonDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.extrato && data.extrato.length > 0) {
                    data.extrato.forEach(entry => {
                        const dataStr = entry.data;
                        const dataObj = convertStringToDate(dataStr);
                        
                        if (!dataInicial || dataObj < dataInicial) {
                            dataInicial = dataObj;
                        }
                        
                        if (!dataFinal || dataObj > dataFinal) {
                            dataFinal = dataObj;
                        }
                    });
                }
            }
        });
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
    
    return {
        dataInicial: formatarData(dataInicial),
        dataFinal: formatarData(dataFinal)
    };
}

function obterTransacoesRecentes(limite = 10) {
    console.log('Obtendo transações mais recentes...');
    const files = fs.readdirSync(jsonDir);
    let transacoes = [];

    try {
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(jsonDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.extrato && data.extrato.length > 0) {
                    transacoes = transacoes.concat(data.extrato);
                }
            }
        });
        
        // Ordena as transações por data (mais recente primeiro)
        transacoes.sort((a, b) => {
            const dataA = convertStringToDate(a.data);
            const dataB = convertStringToDate(b.data);
            return dataB - dataA;
        });
        
        // Limita o número de transações
        transacoes = transacoes.slice(0, limite);
        
        // Formata os valores
        transacoes = transacoes.map(transacao => {
            return {
                ...transacao,
                valorFormatado: new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(transacao.valor),
                saldoFormatado: new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(transacao.saldo_transacao)
            };
        });
        
    } catch (error) {
        console.error('Erro ao obter transações recentes:', error);
    }
    
    return transacoes;
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
        transacoes = [];
        const files = fs.readdirSync(jsonDir);
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(jsonDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.extrato && data.extrato.length > 0) {
                    transacoes = transacoes.concat(data.extrato);
                }
            }
        });
    }
    
    // Se não houver transações, retorna o resumo vazio
    if (!transacoes || transacoes.length === 0) {
        return resumo;
    }
    
    // Calcula o saldo atual (último saldo da lista ordenada por data)
    transacoes.sort((a, b) => {
        const dataA = convertStringToDate(a.data);
        const dataB = convertStringToDate(b.data);
        return dataB - dataA;
    });
    
    // Pega o saldo da transação mais recente
    if (transacoes.length > 0) {
        resumo.saldoAtual.valor = parseFloat(transacoes[0].saldo_transacao);
        resumo.saldoAtual.valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(resumo.saldoAtual.valor);
    }
    
    // Calcula os gastos por data
    transacoes.forEach(transacao => {
        const data = transacao.data;
        const valor = parseFloat(transacao.valor);
        
        // Gastos por data (apenas valores negativos)
        if (valor < 0) {
            if (!resumo.gastosPorData[data]) resumo.gastosPorData[data] = 0;
            resumo.gastosPorData[data] += valor;
            
            // Acumula o total de gastos
            resumo.totalGastos.valor += Math.abs(valor);
        }
        
        // Saldo por dia
        if (!resumo.saldoPorDia[data]) resumo.saldoPorDia[data] = 0;
        resumo.saldoPorDia[data] = parseFloat(transacao.saldo_transacao);
        
        // Categoriza a transação
        let categoria = 'Outras';
        const descricao = transacao.descricao;
        
        // Categorias baseadas em expressões regulares
        if (verificarCategoria(listaExpressoes.transferenciaPessoa, descricao)) {
            categoria = 'Transferência (Pessoa)';
        } else if (verificarCategoria(listaExpressoes.uber, descricao)) {
            categoria = 'Uber';
        } else if (verificarCategoria(listaExpressoes.alimentacao, descricao)) {
            categoria = 'Alimentação';
        } else if (verificarCategoria(listaExpressoes.apostas, descricao)) {
            categoria = 'Apostas';
        } else if (verificarCategoria(listaExpressoes.aluguel, descricao)) {
            categoria = 'Aluguel';
        } else if (verificarCategoria(listaExpressoes.agua, descricao)) {
            categoria = 'Água';
        } else if (verificarCategoria(listaExpressoes.luz, descricao)) {
            categoria = 'Luz';
        } else if (verificarCategoria(listaExpressoes.dogs, descricao)) {
            categoria = 'Dogs';
        } else if (verificarCategoria(listaExpressoes.gas, descricao)) {
            categoria = 'Gás';
        }
        
        // Acumula o valor por categoria (valores absolutos)
        if (!resumo.valorPorCategoria[categoria]) resumo.valorPorCategoria[categoria] = 0;
        resumo.valorPorCategoria[categoria] += Math.abs(valor);
    });
    
    // Formata o total de gastos
    resumo.totalGastos.valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(resumo.totalGastos.valor);
    
    // Calcula o período do extrato
    let dataInicial = null;
    let dataFinal = null;
    
    transacoes.forEach(transacao => {
        const dataObj = convertStringToDate(transacao.data);
        
        if (!dataInicial || dataObj < dataInicial) {
            dataInicial = dataObj;
        }
        
        if (!dataFinal || dataObj > dataFinal) {
            dataFinal = dataObj;
        }
    });
    
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
    
    return resumo;
}

function obterCategorias() {
    console.log("Entrando na função obterCategorias");
    return [
        { id: 1, name: 'Uber' },
        { id: 2, name: 'Alimentação' },
        { id: 3, name: 'Apostas' },
        { id: 4, name: 'Aluguel' },
        { id: 5, name: 'Água' },
        { id: 6, name: 'Luz' },
        { id: 7, name: 'Dogs' },
        { id: 8, name: 'Gás' },
        { id: 9, name: 'Outras' },
        { id: 10, name: 'Transferência (Pessoa)'}
    ];
}

function obterResumoFinanceiro() {
    console.log("Entrando na função obterResumoFinanceiro");
    try {
        // Calcula o resumo financeiro com todas as transações
        const resumo = calcularResumoFinanceiro();
        
        // Adiciona informações adicionais
        resumo.categorias = obterCategorias();
        resumo.periodoExtrato = obterPeriodoExtrato();
        
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

function getTransacoesRecentes(limite) {
    try {
        const diretorioExtratos = path.join(__dirname, '../../dao/extrato_inter_json');
        
        // Verifica se o diretório existe
        if (!fs.existsSync(diretorioExtratos)) {
            console.error('Diretório de extratos não encontrado:', diretorioExtratos);
            return [];
        }
        
        // Lê todos os arquivos do diretório
        const arquivos = fs.readdirSync(diretorioExtratos)
            .filter(arquivo => arquivo.endsWith('.json'));
        
        // Array para armazenar todas as transações
        let todasTransacoes = [];
        
        // Processa cada arquivo
        arquivos.forEach(arquivo => {
            try {
                const caminhoArquivo = path.join(diretorioExtratos, arquivo);
                const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
                const transacoes = JSON.parse(conteudo);
                
                // Verifica se o arquivo tem o formato esperado (array de transações)
                if (Array.isArray(transacoes)) {
                    // Adiciona as transações ao array
                    todasTransacoes = todasTransacoes.concat(
                        transacoes.map(transacao => ({
                            ...transacao,
                            arquivo: arquivo // opcional: adiciona o nome do arquivo de origem
                        }))
                    );
                }
            } catch (erro) {
                console.error(`Erro ao processar o arquivo ${arquivo}:`, erro);
            }
        });
        
        // Converte as datas do formato DD/MM/YYYY para objetos Date para ordenação correta
        todasTransacoes.forEach(transacao => {
            if (transacao.data && typeof transacao.data === 'string') {
                const partes = transacao.data.split('/');
                if (partes.length === 3) {
                    // Cria uma data no formato MM/DD/YYYY para o construtor Date
                    transacao._dataObj = new Date(`${partes[1]}/${partes[0]}/${partes[2]}`);
                }
            }
        });
        
        // Ordena as transações por data (mais recente primeiro)
        todasTransacoes.sort((a, b) => {
            // Usa os objetos Date criados acima
            if (a._dataObj && b._dataObj) {
                return b._dataObj - a._dataObj; // Ordem decrescente (mais recente primeiro)
            }
            return 0;
        });
        
        // Remove a propriedade temporária _dataObj antes de retornar
        todasTransacoes = todasTransacoes.map(transacao => {
            const { _dataObj, ...resto } = transacao;
            return resto;
        });
        
        // Retorna as transações mais recentes, limitadas pelo parâmetro
        return todasTransacoes.slice(0, limite);
    } catch (erro) {
        console.error('Erro ao obter transações recentes:', erro);
        return [];
    }
}

module.exports = {
    getTransacoesRecentes,
    filtroCategoriaData,
    saldoAtual,
    valorGastoPorData,
    saldoTotalPorDia,
    valorPorCategoria,
    obterPeriodoExtrato,
    obterTransacoesRecentes,
    calcularResumoFinanceiro,
    obterCategorias,
    obterResumoFinanceiro
}