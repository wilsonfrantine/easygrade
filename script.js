let matrizRespostas = [];
let videoStream;

// Função para mostrar a página correspondente
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Gerenciar a câmera conforme a página
    if (pageId === 'page-scan-answer-sheet') {
        startCamera();
    } else {
        stopCamera();
    }
}

// Função para iniciar a câmera
function startCamera() {
    const video = document.getElementById('video');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoStream = stream;
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Erro ao acessar a câmera: ", err);
            alert("Não foi possível acessar a câmera. Verifique as permissões.");
        });
}

// Função para parar a câmera
function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
}

// Função para capturar a imagem da folha de respostas
function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Processamento básico da imagem para detectar as marcas (simulado)
    matrizRespostas = processaImagem(canvas);
    showPage('page-confirmation');
}

// Função simulada de processamento de imagem
function processaImagem(canvas) {
    // Simulação de processamento e retorno de matriz de respostas
    return [
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 1]
    ];
}

// Função para confirmar os resultados
function confirmResults() {
    document.getElementById("results").innerText = `Respostas confirmadas: ${JSON.stringify(matrizRespostas)}`;
    showPage('page-results');
}

// Função para exportar os resultados para CSV
function exportarParaCSV(matriz) {
    let csvContent = "data:text/csv;charset=utf-8,";
    matriz.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "resultados_gabarito.csv");
    document.body.appendChild(link);

    link.click();
}

function finalizar() {
    alert("Aplicação finalizada.");
    // Aqui você pode adicionar lógica para finalizar o fluxo
}

// Iniciar o processo de leitura do QR code ao carregar a página
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

// Função para leitura do QR code
function onScanSuccess(decodedText, decodedResult) {
    document.getElementById("result").innerText = `QR Code detectado: ${decodedText}`;
    setTimeout(() => {
        showPage('page-scan-answer-sheet');
    }, 1000);
}

function onScanFailure(error) {
    // Lógica em caso de erro na leitura do QR Code
}
