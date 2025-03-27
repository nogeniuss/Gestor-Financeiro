document.getElementById('submitBtn').addEventListener('click', async function (event) {
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
      // Mostrar indicador de carregamento
      const loadingElement = document.createElement('div');
      loadingElement.id = 'loading';
      loadingElement.textContent = 'Convertendo arquivo...';
      document.body.appendChild(loadingElement);
      
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      });
  
      // Remover indicador de carregamento
      document.getElementById('loading').remove();
      
      const result = await response.json();
      if (response.ok) {
        alert('Arquivo convertido com sucesso!\nJSON salvo em: ' + result.jsonPath);
      } else {
        alert('Erro ao converter o arquivo: ' + result.error);
      }
    } catch (error) {
      // Remover indicador de carregamento se existir
      const loadingElement = document.getElementById('loading');
      if (loadingElement) loadingElement.remove();
      
      console.error('Erro ao enviar arquivo:', error);
      alert('Erro ao enviar arquivo. Verifique o console para mais detalhes.');
    }
  });
  