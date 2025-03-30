document.addEventListener('DOMContentLoaded', function() {
    // Carregar análise financeira ao carregar a página
    loadFinancialAnalysis();
    
    // Configurar eventos
    document.getElementById('refresh-analysis').addEventListener('click', loadFinancialAnalysis);
    document.getElementById('recommendations-form').addEventListener('submit', function(e) {
        e.preventDefault();
        getPersonalizedRecommendations();
    });
});

async function loadFinancialAnalysis() {
    // Mostrar loading
    document.getElementById('loading-analysis').classList.remove('d-none');
}