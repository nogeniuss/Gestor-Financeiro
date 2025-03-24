const financialService = require('../services/financialService');

console.log('financialController.js carregado');
class FinancialController {

    async getSaldo(req, res) {
        try {
            console.log('getSaldo chamado');
            const saldo = financialService.saldoAtual();
            res.status(200).json({
                success: true,
                saldo: saldo,
                saldoFormatado: saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
            const gastosPorData = financialService.valorGastoPorData();

            // Formata os valores para exibição
            const gastosFormatados = {};
            for (const [data, valor] of Object.entries(gastosPorData)) {
                gastosFormatados[data] = {
                    valor: valor,
                    valorFormatado: Math.abs(valor).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    })
                };
            }

            res.status(200).json({
                success: true,
                gastosPorData: gastosFormatados
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
            const saldoPorDia = financialService.saldoTotalPorDia();

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
                saldoPorDia: saldosFormatados
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
            const valorPorCategoria = financialService.valorPorCategoria();

            // Formata os valores para exibição
            const categoriasFormatadas = {};
            for (const [categoria, valor] of Object.entries(valorPorCategoria)) {
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
                valorPorCategoria: categoriasFormatadas
            });
        } catch (error) {
            console.error('Erro ao obter valor por categoria:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter valor por categoria',
                error: error.message
            });
        }
    }

    async filtrarTransacoes(req, res) {
        console.log('filtrarTransacoes chamado');
        try {
            const { categoria, dataInicio, dataFim } = req.body;

            // Validação dos parâmetros
            if (!categoria || !dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros inválidos. Categoria, data inicial e data final são obrigatórios.'
                });
            }

            const transacoesFiltradas = financialService.filtroCategoriaData(
                categoria,
                dataInicio,
                dataFim
            );

            // Formata os valores para exibição
            const transacoesFormatadas = transacoesFiltradas.map(transacao => ({
                ...transacao,
                valorFormatado: parseFloat(transacao.valor).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                saldoFormatado: parseFloat(transacao.saldo_transacao).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })
            }));

            res.status(200).json({
                success: true,
                transacoes: transacoesFormatadas,
                total: transacoesFormatadas.length
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

    async getResumoFinanceiro(req, res) {
        console.log('getResumoFinanceiro chamado');

        try {
            const saldo = financialService.saldoAtual();
            const gastosPorData = financialService.valorGastoPorData();
            const saldoPorDia = financialService.saldoTotalPorDia();
            const valorPorCategoria = financialService.valorPorCategoria();

            // Calcula o total de gastos (valores negativos)
            const totalGastos = Object.values(gastosPorData).reduce((acc, curr) => acc + curr, 0);

            // Calcula o total por categoria
            const totalPorCategoria = {};
            for (const [categoria, valor] of Object.entries(valorPorCategoria)) {
                totalPorCategoria[categoria] = valor;
            }

            res.status(200).json({
                success: true,
                resumo: {
                    saldoAtual: {
                        valor: saldo,
                        valorFormatado: saldo.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        })
                    },
                    totalGastos: {
                        valor: totalGastos,
                        valorFormatado: Math.abs(totalGastos).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        })
                    },
                    gastosPorData,
                    saldoPorDia,
                    valorPorCategoria: totalPorCategoria
                }
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

    async getTransacoesRecentes(req, res) {
        try {
            console.log('getTransacoesRecentes chamado');
            const limite = parseInt(req.query.limite) || 10;
            const transacoes = financialService.getTransacoesRecentes(limite);

            // Formata os valores para exibição
            const transacoesFormatadas = transacoes.map(transacao => ({
                ...transacao,
                valorFormatado: typeof transacao.valor === 'number'
                    ? transacao.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    })
                    : transacao.valor
            }));

            res.status(200).json({
                success: true,
                transacoes: transacoesFormatadas
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
}


module.exports = new FinancialController();
