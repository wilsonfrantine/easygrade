document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.getElementById('videoElement');
    const detectButton = document.getElementById('detectButton');
    const statusMessage = document.getElementById('statusMessage');

    if (!videoElement) {
        console.error('Elemento de vídeo não encontrado!');
        statusMessage.innerHTML = 'Erro: Elemento de vídeo não encontrado!';
        return;
    }

    // Adiciona um evento para iniciar a detecção quando o vídeo estiver carregado
    videoElement.addEventListener('loadeddata', () => {
        console.log('Iniciando a detecção com o vídeo.');
        iniciarDeteccaoDeGabarito(videoElement, document.getElementById('videoCanvas'), () => {
            console.log('Detecção completada.');
        });
    });

    // Verificar se o vídeo não está disponível após um tempo
    setTimeout(() => {
        if (!videoElement.srcObject) {
            statusMessage.innerHTML = 'Vídeo não encontrado. Certifique-se de que você habilitou a câmera.';
            console.error('Stream de vídeo não está disponível.');
        }
    }, 10000); // Verifica após 10 segundos

    // Outros códigos que precisam do DOM completamente carregado
});
