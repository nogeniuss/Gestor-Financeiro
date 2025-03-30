document.addEventListener('DOMContentLoaded', function() {
  // Configurar o formulário de upload
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('file');
  const submitBtn = document.getElementById('submitBtn');
  const progressContainer = document.getElementById('progress-container');
  const uploadProgress = document.getElementById('upload-progress');
  const currentFileInfo = document.getElementById('current-file-info');
  const processedFilesTableBody = document.getElementById('processed-files-table-body');
  
  // Simular arquivos recentes
  displayRecentFiles();
  
  // Configurar botão de atualizar
  document.getElementById('btn-refresh-upload').addEventListener('click', function() {
      // Simular atualização
      processedFilesTableBody.innerHTML = `
          <tr>
              <td colspan="2" class="text-center">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                      <span class="visually-hidden">Carregando...</span>
                  </div>
                  Atualizando...
              </td>
          </tr>
      `;
      
      // Simular atraso de rede
      setTimeout(displayRecentFiles, 800);
  });
  
  // Atualizar informações do arquivo selecionado
  fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          currentFileInfo.textContent = `Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})`;
      } else {
          currentFileInfo.textContent = '';
      }
  });
  
  // Configurar envio do formulário
  uploadForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const fileInput = document.getElementById('file');
      
      if (!fileInput.files.length) {
          alert('Por favor, selecione um arquivo antes de enviar.');
          return;
      }
      
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      try {
          // Mostrar barra de progresso
          progressContainer.style.display = 'block';
          uploadProgress.style.width = '0%';
          uploadProgress.setAttribute('aria-valuenow', '0');
          uploadProgress.textContent = '0%';
          
          // Desabilitar botão durante o upload
          submitBtn.disabled = true;
          
          // Iniciar simulação de progresso
          let progress = 0;
          const progressInterval = setInterval(() => {
              if (progress < 90) {
                  progress += Math.random() * 10;
                  if (progress > 90) progress = 90;
                  
                  updateProgressBar(progress);
              }
          }, 300);
          
          const response = await fetch('/api/upload-csv', {
              method: 'POST',
              body: formData
          });
          
          // Limpar intervalo de progresso
          clearInterval(progressInterval);
          
          // Completar a barra de progresso
          updateProgressBar(100);
          
          const result = await response.json();
          
          if (response.ok) {
              // Sucesso
              uploadProgress.classList.remove('bg-primary');
              uploadProgress.classList.add('bg-success');
              currentFileInfo.textContent = `Arquivo convertido com sucesso: ${result.jsonPath || 'arquivo.json'}`;
              
              // Atualizar lista de arquivos recentes
              setTimeout(displayRecentFiles, 1000);
              
              // Mostrar status de processamento
              document.getElementById('processing-status').innerHTML = `
                  <div class="alert alert-success" role="alert">
                      <i class="bi bi-check-circle-fill me-2"></i>
                      Arquivo processado com sucesso!
                  </div>
              `;
              
              // Resetar formulário após 3 segundos
              setTimeout(() => {
                  progressContainer.style.display = 'none';
                  uploadForm.reset();
                  currentFileInfo.textContent = '';
                  submitBtn.disabled = false;
                  uploadProgress.classList.remove('bg-success');
                  uploadProgress.classList.add('bg-primary');
                  
                  // Restaurar status de processamento após 5 segundos
                  setTimeout(() => {
                      document.getElementById('processing-status').innerHTML = `
                          <div class="alert alert-info" role="alert">
                              <i class="bi bi-info-circle me-2"></i>
                              Nenhum arquivo em processamento no momento.
                          </div>
                      `;
                  }, 5000);
              }, 3000);
          } else {
              // Erro
              uploadProgress.classList.remove('bg-primary');
              uploadProgress.classList.add('bg-danger');
              currentFileInfo.textContent = `Erro: ${result.error || 'Falha na conversão'}`;
              submitBtn.disabled = false;
              
              // Mostrar status de erro
              document.getElementById('processing-status').innerHTML = `
                  <div class="alert alert-danger" role="alert">
                      <i class="bi bi-exclamation-triangle-fill me-2"></i>
                      Falha no processamento: ${result.error || 'Erro desconhecido'}
                  </div>
              `;
          }
      } catch (error) {
          console.error('Erro ao enviar arquivo:', error);
          uploadProgress.classList.remove('bg-primary');
          uploadProgress.classList.add('bg-danger');
          currentFileInfo.textContent = 'Erro ao enviar arquivo. Verifique o console para mais detalhes.';
          submitBtn.disabled = false;
          
          // Mostrar status de erro
          document.getElementById('processing-status').innerHTML = `
              <div class="alert alert-danger" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  Erro ao enviar arquivo: Falha na conexão com o servidor
              </div>
          `;
      }
  });
  
  /**
   * Atualiza a barra de progresso
   */
  function updateProgressBar(percentage) {
      const roundedPercentage = Math.round(percentage);
      uploadProgress.style.width = `${roundedPercentage}%`;
      uploadProgress.setAttribute('aria-valuenow', roundedPercentage);
      uploadProgress.textContent = `${roundedPercentage}%`;
  }
  
  /**
   * Formata o tamanho do arquivo para exibição
   */
  function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Exibe a lista de arquivos recentes (simulada)
   */
  async function displayRecentFiles() {
    try {
      // Mostrar indicador de carregamento
      processedFilesTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
            Carregando arquivos...
          </td>
        </tr>
      `;
      
      // Buscar dados reais da API
      const response = await fetch('/api/recent-uploads');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar arquivos recentes');
      }
      
      const files = await response.json();
      
      // Limpar tabela
      processedFilesTableBody.innerHTML = '';
      
      // Se não houver arquivos
      if (files.length === 0) {
        processedFilesTableBody.innerHTML = `
          <tr>
            <td colspan="2" class="text-center text-muted">
              <i class="bi bi-info-circle me-2"></i>Nenhum arquivo encontrado
            </td>
          </tr>
        `;
        return;
      }
      
      // Adicionar cada arquivo à tabela
      files.forEach(file => {
        const row = document.createElement('tr');
        
        // Coluna de nome do arquivo
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<i class="bi bi-file-earmark-text me-2"></i>${file.name}`;
        row.appendChild(nameCell);
        
        // Coluna de status
        const statusCell = document.createElement('td');
        if (file.status === 'success') {
          statusCell.innerHTML = `<span class="badge bg-success">Processado</span>`;
        } else {
          statusCell.innerHTML = `<span class="badge bg-warning">Pendente</span>`;
        }
        row.appendChild(statusCell);
        
        processedFilesTableBody.appendChild(row);
      });
      
      // Adicionar o arquivo atual se estiver sendo processado
      if (fileInput.files.length > 0 && submitBtn.disabled) {
        const row = document.createElement('tr');
        
        // Coluna de nome do arquivo
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<i class="bi bi-file-earmark-text me-2"></i>${fileInput.files[0].name}`;
        row.appendChild(nameCell);
        
        // Coluna de status
        const statusCell = document.createElement('td');
        statusCell.innerHTML = `<span class="badge bg-primary">Processando</span>`;
        row.appendChild(statusCell);
        
        // Inserir no topo da tabela
        processedFilesTableBody.insertBefore(row, processedFilesTableBody.firstChild);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos recentes:', error);
      processedFilesTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>Erro ao carregar arquivos
          </td>
        </tr>
      `;
    }
  }

});

