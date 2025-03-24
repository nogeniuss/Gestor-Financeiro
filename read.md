Controller: Responsável por receber requisições e chamar os serviços apropriados. Como convert.js não está lidando com requisições diretamente, não deve ficar aqui.

Service ✅ (Melhor opção): Camada responsável pela lógica de negócios, incluindo manipulação de arquivos, chamadas a APIs e processamento de dados. Como convert.js é um processador de arquivos, ele deve estar aqui.

DAO (Data Access Object): Responsável apenas por comunicação com banco de dados. Como convert.js não interage diretamente com o banco, não deve ficar aqui.