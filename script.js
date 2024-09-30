// Função para mostrar um elemento e esconder outro
function toggleVisibility(showElementId, hideElementId) {
    document.getElementById(showElementId).classList.remove('hidden');
    document.getElementById(hideElementId).classList.add('hidden');
}

// Função para inicializar o aplicativo após o DOM estar carregado
function initApp() {
    document.getElementById('criarGabarito').addEventListener('click', function() {
        toggleVisibility('criarGabaritoDiv', 'menu');
        window.scrollTo(0, 0);
    });

    document.querySelectorAll('.voltar').forEach(function(btn) {
        btn.addEventListener('click', function() {
            toggleVisibility('menu', 'lerGabaritoDiv');
            toggleVisibility('menu', 'criarGabaritoDiv');
            window.scrollTo(0, 0);
        });
    });

    // Captura a imagem do vídeo quando o botão é clicado
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    document.getElementById('capture').addEventListener('click', function() {
        const video = document.getElementById('video');
        context.drawImage(video, 0, 0, 640, 480);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
