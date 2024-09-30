const appState = {
    currentView: 'menu'
};

function toggleVisibility(showElementId, hideElementId) {
    document.getElementById(showElementId).classList.remove('hidden');
    document.getElementById(hideElementId).classList.add('hidden');
    appState.currentView = showElementId;
}

function initApp() {
    document.getElementById('criarGabarito').addEventListener('click', function() {
        toggleVisibility('criarGabaritoDiv', 'menu');
        window.scrollTo(0, 0);
    });

    document.getElementById('lerGabarito').addEventListener('click', function() {
        toggleVisibility('lerGabaritoDiv', 'menu');
        window.scrollTo(0, 0);
    });

    document.querySelectorAll('.voltar').forEach(function(btn) {
        btn.addEventListener('click', function() {
            toggleVisibility('menu', appState.currentView);
            window.scrollTo(0, 0);
        });
    });

    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    document.getElementById('capture').addEventListener('click', function() {
        const video = document.getElementById('video');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
