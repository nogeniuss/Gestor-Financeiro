FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install
# Instalar explicitamente os pacotes necessários
RUN npm install papaparse multer

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p dao/extrato_inter_json uploads

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
