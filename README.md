
```markdown
# Personal Finance App

✨ **Visão Geral**

Este é um aplicativo financeiro pessoal desenvolvido em JavaScript puro e Node.js. O objetivo é proporcionar um controle financeiro completo, com detalhamento de receitas, despesas, investimentos e planejamento. Além disso, conta com a integração de um Agente de IA (Mastra AI) para fornecer previsões e insights personalizados.

📈 **Funcionalidades**

- **Dashboard Financeiro**: Resumo das finanças, receitas, despesas e saldo total.
- **Agrupamento de Transações por Expressão Regular**: Categorização automática baseada em palavras-chave.
- **Metas Financeiras**: Definição e acompanhamento de objetivos.
- **Histórico Financeiro**: Registro detalhado de todas as transações.
- **Investimentos**: Monitoramento de ativos e retornos.
- **Integração com API do Banco Inter**: Sincroniza transações bancárias automaticamente.
- **Agente de IA (Mastra AI)**: Sugestões de economia, projeções de saldo e análise de padrões financeiros.

🌐 **Métodos e Simbologias**

- **CRUD de transações**: Criar, Ler, Atualizar e Deletar movimentações financeiras.

### Simbologias:

- 🟢 Receita (Crédito)
- 🔴 Despesa (Débito)
- 🟦 Investimento
- 🟡 Meta atingida
- ⚪ Meta pendente
- 🤖 Sugestão de IA

### **Categorias Financeiras**

#### Despesas:
- 🏡 **Moradia** (Aluguel, contas de casa)
- 🍽️ **Alimentação** (Mercado, restaurantes)
- 🚴 **Transporte** (Uber, gasolina, metrô)
- 👧🏻👨🏻 **Saúde** (Plano de saúde, remédios)
- 🎧 **Entretenimento** (Netflix, cinema, shows)
- 🎓 **Educação** (Cursos, faculdades, livros)
- 💸 **Investimentos** (Ações, criptomoedas, renda fixa)
- 💳 **Cartão de Crédito** (Pagamentos de fatura)
- 💼 **Impostos** (IPTU, IPVA, taxas)
- 👥 **Lazer e compras** (Roupas, viagens, hobbies)

#### Receitas:
- 💰 **Salário**
- 📚 **Freelance / Trabalho extra**
- 🏢 **Aluguel recebido**
- 💡 **Dividendos / Rendimentos**
- 🍀 **Premiações / Bonificações**

### **Dashboards por Página**

#### Tela Inicial - Resumo Financeiro:
- 🔄 **Gráfico de Pizza**: Mostra a proporção entre despesas e receitas.
- 📊 **Gráfico de Linha**: Exibe a evolução do saldo mensal.
- 🤖 **Sugestões da IA**: Insights sobre padrões financeiros e recomendações de economia.

#### Transações - Histórico Financeiro:
- 🔢 **Tabela Detalhada**: Lista de transações filtradas por categoria.
- 📉 **Gráfico de Barras**: Volume de despesas e receitas por categoria.
- 🤖 **Análise da IA**: Identificação de gastos recorrentes e alertas sobre variações.

#### Metas Financeiras:
- 🏆 **Barra de Progresso**: Indica o percentual de alcance de cada meta.
- 📅 **Gráfico de Projeção**: Mostra a previsão de alcance das metas financeiras.
- 🤖 **Previsão de IA**: Sugestões sobre ajustes de metas para melhor planejamento.

#### Investimentos:
- 📈 **Gráfico de Crescimento**: Acompanhamento da evolução dos ativos.
- 🏦 **Distribuição de Ativos**: Percentual investido em cada tipo de ativo.
- 🤖 **Insights da IA**: Projeções de desempenho dos investimentos com base em histórico.

### 🤖 **Integração com Mastra AI**

#### O que é o Mastra AI?
O Mastra AI é um agente de inteligência artificial personalizável que pode ser treinado para fornecer previsões e insights baseados nos seus dados financeiros. Ele ajudará a detectar padrões, sugerir ajustes de orçamento e prever futuros saldos.

#### Como Integrar o Mastra AI ao Projeto?
1. Clone o repositório do Mastra AI:

   ```bash
   git clone https://github.com/mastra-ai/mastra.git
   ```

2. Configure os dados financeiros como fonte de aprendizado da IA.
3. Ajuste os modelos para priorizar previsões de gastos e receitas.
4. Integre o Mastra AI ao painel de controle do Personal Finance App.

### 🔑 **Integração com API do Banco Inter**

#### 🔒 **Autenticação**
A API utiliza OAuth 2.0. Para obter um token de acesso:

```bash
curl -X POST "https://cdpj.partners.bancointer.com.br/oauth/v2/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=SEU_CLIENT_ID" \
-d "client_secret=SEU_CLIENT_SECRET" \
-d "grant_type=client_credentials"
```

#### 🔍 **Requisições Importantes**

- **Obter Saldo**:

```bash
curl -X GET "https://cdpj.partners.bancointer.com.br/banking/v2/saldo" \
-H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

- **Obter Extrato**:

```bash
curl -X GET "https://cdpj.partners.bancointer.com.br/banking/v2/extrato" \
-H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

- **Obter Faturas de Cartão**:

```bash
curl -X GET "https://cdpj.partners.bancointer.com.br/banking/v2/cartoes/faturas" \
-H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### 🔎 **Estrutura de Respostas da API**

Exemplo de resposta da API do extrato bancário:

```json
{
  "transacoes": [
    {
      "id": "12345",
      "data": "2025-03-19",
      "descricao": "Supermercado XYZ",
      "valor": -150.00,
      "tipo": "DEBITO",
      "categoria": "Alimentação"
    },
    {
      "id": "67890",
      "data": "2025-03-18",
      "descricao": "Salário - Empresa ABC",
      "valor": 5000.00,
      "tipo": "CREDITO",
      "categoria": "Salário"
    }
  ]
}
```

### 🛠️ **Instalação e Execução**

1. Clone o repositório:

   ```bash
   git clone https://github.com/seuusuario/personal-finance-app.git
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as credenciais no arquivo .env:

   ```env
   CLIENT_ID=seu_client_id
   CLIENT_SECRET=seu_client_secret
   ```

4. Inicie o servidor:

   ```bash
   node app.js
   ```

👨‍🎓 **Contribuição**

Sugestões e melhorias são bem-vindas! Envie um pull request ou entre em contato.
```