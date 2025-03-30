const financialService = require('../services/financialService');

console.log('financialController.js carregado');
class FinancialController {

    async getSaldo(req, res) {
        try {
          console.log('getSaldo chamado');
          
          // Extrair parâmetros de data da requisição
          let dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio) : null;
          let dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;
          
          // Se dataFim for fornecida, ajusta para o final do dia
          if (dataFim) {
            dataFim.setHours(23, 59, 59, 999);
          }
          
          // Se não foram fornecidas datas, vamos buscar todas as transações para determinar o intervalo completo
          if (!dataInicio || !dataFim) {
            // Obter todas as transações para determinar o intervalo de datas
            const todasTransacoes = financialService.obterTodasTransacoes();
            
            if (todasTransacoes.length > 0) {
              // Ordenar transações por data
              todasTransacoes.sort((a, b) => {
                const dataA = new Date(a.data.split('/').reverse().join('-'));
                const dataB = new Date(b.data.split('/').reverse().join('-'));
                return dataA - dataB;
              });
              
              // Se dataInicio não foi fornecida, use a data da transação mais antiga
              if (!dataInicio) {
                const dataTransacaoMaisAntiga = todasTransacoes[0].data.split('/');
                dataInicio = new Date(`${dataTransacaoMaisAntiga[2]}-${dataTransacaoMaisAntiga[1]}-${dataTransacaoMaisAntiga[0]}`);
                dataInicio.setHours(0, 0, 0, 0); // Início do dia
              }
              
              // Se dataFim não foi fornecida, use a data da transação mais recente
              if (!dataFim) {
                const dataTransacaoMaisRecente = todasTransacoes[todasTransacoes.length - 1].data.split('/');
                dataFim = new Date(`${dataTransacaoMaisRecente[2]}-${dataTransacaoMaisRecente[1]}-${dataTransacaoMaisRecente[0]}`);
                dataFim.setHours(23, 59, 59, 999); // Final do dia
              }
            }
          }
          
          // Registra as datas para debug
          console.log(`Período utilizado: ${dataInicio ? dataInicio.toISOString() : 'início'} até ${dataFim ? dataFim.toISOString() : 'fim'}`);
          
          // Chama a função saldoAtual com os parâmetros de data
          const saldo = financialService.saldoAtual(dataInicio, dataFim);
          
          res.status(200).json({
            success: true,
            saldo: saldo,
            saldoFormatado: saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            periodo: {
              inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : null,
              fim: dataFim ? dataFim.toISOString().split('T')[0] : null
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
      }

    async getValorGastoPorData(req, res) {
        console.log('getValorGastoPorData chamado');
        
        try {
          // Extrair parâmetros de data da requisição
          let dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio) : null;
          let dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;
          
          // Se dataFim for fornecida, ajusta para o final do dia
          if (dataFim) {
            dataFim.setHours(23, 59, 59, 999);
          }
          
          // Se não foram fornecidas datas, determina o intervalo completo
          if (!dataInicio || !dataFim) {
            const todasTransacoes = financialService.obterTodasTransacoes();
            
            if (todasTransacoes.length > 0) {
              // Ordena transações por data
              todasTransacoes.sort((a, b) => {
                const dataA = new Date(a.data.split('/').reverse().join('-'));
                const dataB = new Date(b.data.split('/').reverse().join('-'));
                return dataA - dataB;
              });
              
              // Se dataInicio não foi fornecida, use a data da transação mais antiga
              if (!dataInicio) {
                const dataTransacaoMaisAntiga = todasTransacoes[0].data.split('/');
                dataInicio = new Date(`${dataTransacaoMaisAntiga[2]}-${dataTransacaoMaisAntiga[1]}-${dataTransacaoMaisAntiga[0]}`);
                dataInicio.setHours(0, 0, 0, 0); // Início do dia
              }
              
              // Se dataFim não foi fornecida, use a data da transação mais recente
              if (!dataFim) {
                const dataTransacaoMaisRecente = todasTransacoes[todasTransacoes.length - 1].data.split('/');
                dataFim = new Date(`${dataTransacaoMaisRecente[2]}-${dataTransacaoMaisRecente[1]}-${dataTransacaoMaisRecente[0]}`);
                dataFim.setHours(23, 59, 59, 999); // Final do dia
              }
            }
          }
          
          // Registra as datas para debug
          console.log(`Período utilizado: ${dataInicio ? dataInicio.toISOString() : 'início'} até ${dataFim ? dataFim.toISOString() : 'fim'}`);
          
          // Chama a função valorGastoPorData com os parâmetros de data
          const gastosPorData = financialService.valorGastoPorData(dataInicio, dataFim);
          
          // Formata os valores para exibição
          const gastosFormatados = {};
          for (const [data, valor] of Object.entries(gastosPorData)) {
            gastosFormatados[data] = {
              valor: valor,
              valorFormatado: valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })
            };
          }
          
          res.status(200).json({
            success: true,
            gastosPorData: gastosFormatados,
            periodo: {
              inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : null,
              fim: dataFim ? dataFim.toISOString().split('T')[0] : null
            }
          });
        } catch (error) {
          console.error('Erro ao obter gastos por data:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter gastos por data',
            error: error.message
          });
        }
      }

      async getSaldoPorDia(req, res) {
        console.log('getSaldoPorDia chamado');
        
        try {
          // Extrair parâmetros de data da requisição
          let dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio) : null;
          let dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;
          
          // Se dataFim for fornecida, ajusta para o final do dia
          if (dataFim) {
            dataFim.setHours(23, 59, 59, 999);
          }
          
          // Se não foram fornecidas datas, determina o intervalo completo
          if (!dataInicio || !dataFim) {
            const todasTransacoes = financialService.obterTodasTransacoes();
            
            if (todasTransacoes.length > 0) {
              // Ordena transações por data
              todasTransacoes.sort((a, b) => {
                const dataA = new Date(a.data.split('/').reverse().join('-'));
                const dataB = new Date(b.data.split('/').reverse().join('-'));
                return dataA - dataB;
              });
              
              // Se dataInicio não foi fornecida, use a data da transação mais antiga
              if (!dataInicio) {
                const dataTransacaoMaisAntiga = todasTransacoes[0].data.split('/');
                dataInicio = new Date(`${dataTransacaoMaisAntiga[2]}-${dataTransacaoMaisAntiga[1]}-${dataTransacaoMaisAntiga[0]}`);
                dataInicio.setHours(0, 0, 0, 0); // Início do dia
              }
              
              // Se dataFim não foi fornecida, use a data da transação mais recente
              if (!dataFim) {
                const dataTransacaoMaisRecente = todasTransacoes[todasTransacoes.length - 1].data.split('/');
                dataFim = new Date(`${dataTransacaoMaisRecente[2]}-${dataTransacaoMaisRecente[1]}-${dataTransacaoMaisRecente[0]}`);
                dataFim.setHours(23, 59, 59, 999); // Final do dia
              }
            }
          }
          
          // Registra as datas para debug
          console.log(`Período utilizado: ${dataInicio ? dataInicio.toISOString() : 'início'} até ${dataFim ? dataFim.toISOString() : 'fim'}`);
          
          // Chama a função saldoTotalPorDia com os parâmetros de data
          const saldoPorDia = financialService.saldoTotalPorDia(dataInicio, dataFim);
          
          // Formata os valores para exibição
          const saldosFormatados = {};
          for (const [data, valor] of Object.entries(saldoPorDia)) {
            saldosFormatados[data] = {
              valor: valor,
              valorFormatado: valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })
            };
          }
          
          res.status(200).json({
            success: true,
            saldoPorDia: saldosFormatados,
            periodo: {
              inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : null,
              fim: dataFim ? dataFim.toISOString().split('T')[0] : null
            }
          });
        } catch (error) {
          console.error('Erro ao obter saldo por dia:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter saldo por dia',
            error: error.message
          });
        }
      }
      
      async getValorPorCategoria(req, res) {
        console.log('getValorPorCategoria chamado');
        
        try {
          // Extrair parâmetros de data da requisição
          let dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio) : null;
          let dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;
          
          // Se dataFim for fornecida, ajusta para o final do dia
          if (dataFim) {
            dataFim.setHours(23, 59, 59, 999);
          }
          
          // Chama a função valorPorCategoria com os parâmetros de data
          const valoresPorCategoria = financialService.valorPorCategoria(dataInicio, dataFim);
          
          // Formata os valores para exibição
          const categoriasFormatadas = {};
          for (const [categoria, valor] of Object.entries(valoresPorCategoria)) {
            categoriasFormatadas[categoria] = {
              valor: valor,
              valorFormatado: valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })
            };
          }
          
          res.status(200).json({
            success: true,
            valoresPorCategoria: categoriasFormatadas,
            periodo: {
              inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : null,
              fim: dataFim ? dataFim.toISOString().split('T')[0] : null
            }
          });
        } catch (error) {
          console.error('Erro ao obter valores por categoria:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter valores por categoria',
            error: error.message
          });
        }
    }
    async filtrarTransacoes(req, res) {
        console.log('filtrarTransacoes chamado');
        
        try {
          const { categoria, dataInicio, dataFim } = req.body;
          
          // Validação dos parâmetros
          if (!categoria) {
            return res.status(400).json({
              success: false,
              message: 'Categoria é obrigatória.'
            });
          }
          
          if (!dataInicio || !dataFim) {
            return res.status(400).json({
              success: false,
              message: 'Data inicial e data final são obrigatórias.'
            });
          }
          
          // Validação de formato de data (assumindo formato DD/MM/YYYY)
          const validarData = (data) => {
            return /^\d{2}\/\d{2}\/\d{4}$/.test(data);
          };
          
          if (!validarData(dataInicio) || !validarData(dataFim)) {
            return res.status(400).json({
              success: false,
              message: 'Formato de data inválido. Use DD/MM/YYYY.'
            });
          }
          
          const transacoesFiltradas = financialService.filtroCategoriaData(
            categoria,
            dataInicio,
            dataFim
          );
          
          // Se não houver transações, retorna um array vazio
          if (!transacoesFiltradas || transacoesFiltradas.length === 0) {
            return res.status(200).json({
              success: true,
              transacoes: [],
              total: 0,
              message: 'Nenhuma transação encontrada para os filtros informados.'
            });
          }
          
          // Formatador de moeda
          const formatarMoeda = (valor) => {
            if (valor === undefined || valor === null) return 'R$ 0,00';
            
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(valor);
          };
          
          // Formata os valores para exibição
          const transacoesFormatadas = transacoesFiltradas.map(transacao => ({
            ...transacao,
            valorFormatado: formatarMoeda(parseFloat(transacao.valor)),
            saldoFormatado: formatarMoeda(
              parseFloat(
                transacao.saldo_transacao !== undefined ? 
                transacao.saldo_transacao : transacao.saldo
              )
            )
          }));
          
          // Calcula o total de gastos (valores negativos)
          const totalGastos = transacoesFormatadas
            .filter(t => parseFloat(t.valor) < 0)
            .reduce((acc, curr) => acc + Math.abs(parseFloat(curr.valor)), 0);
          
          res.status(200).json({
            success: true,
            transacoes: transacoesFormatadas,
            total: transacoesFormatadas.length,
            totalGastos: {
              valor: totalGastos,
              valorFormatado: formatarMoeda(totalGastos)
            }
          });
          
        } catch (error) {
          console.error('Erro ao filtrar transações:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao filtrar transações',
            error: error.message
          });
        }
      }
      
      /**
       * Obtém o resumo financeiro completo
       * @param {Object} req - Requisição Express
       * @param {Object} res - Resposta Express
       */
      async getResumoFinanceiro(req, res) {
        console.log('getResumoFinanceiro chamado');
        
        try {
          // Usar a nova função obterResumoFinanceiro que já faz tudo de uma vez
          const resultado = financialService.obterResumoFinanceiro();
          
          if (!resultado.success) {
            return res.status(500).json({
              success: false,
              message: resultado.message || 'Erro ao obter resumo financeiro',
              error: resultado.error
            });
          }
          
          res.status(200).json({
            success: true,
            resumo: resultado.resumo
          });
          
        } catch (error) {
          console.error('Erro ao obter resumo financeiro:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter resumo financeiro',
            error: error.message
          });
        }
      }
      
      /**
       * Obtém a lista de categorias disponíveis
       * @param {Object} req - Requisição Express
       * @param {Object} res - Resposta Express
       */
      async getCategorias(req, res) {
        try {
          console.log('getCategorias chamado');
          const categorias = financialService.obterCategorias();
          
          res.status(200).json({
            success: true,
            categorias: categorias
          });
          
        } catch (error) {
          console.error('Erro ao obter categorias:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter categorias',
            error: error.message
          });
        }
      }
      
      /**
       * Obtém as transações mais recentes
       * @param {Object} req - Requisição Express
       * @param {Object} res - Resposta Express
       */
      async getTransacoesRecentes(req, res) {
        try {
          console.log('getTransacoesRecentes chamado');
          const limite = parseInt(req.query.limite) || 10;
          
          // Usar a nova função obterTransacoesRecentes em vez de getTransacoesRecentes
          const transacoes = financialService.obterTransacoesRecentes(limite);
          
          // As transações já vêm formatadas da função obterTransacoesRecentes
          res.status(200).json({
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
      }
      
      /**
       * Obtém o período coberto pelos extratos
       * @param {Object} req - Requisição Express
       * @param {Object} res - Resposta Express
       */
      async getPeriodoExtrato(req, res) {
        try {
          console.log('getPeriodoExtrato chamado');
          const periodo = financialService.obterPeriodoExtrato();
          
          res.status(200).json({
            success: true,
            periodo: periodo
          });
          
        } catch (error) {
          console.error('Erro ao obter período do extrato:', error);
          res.status(500).json({
            success: false,
            message: 'Erro ao obter período do extrato',
            error: error.message
          });
        }
      }
    }
    


module.exports = new FinancialController();
