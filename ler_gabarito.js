let currentStream = null;
let currentDeviceId = null;
let processing = false;

document.getElementById('lerGabarito').addEventListener('click', function () {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('lerGabaritoDiv').classList.remove('hidden');
    window.scrollTo(0, 0);
    iniciarCamera();
    processarVideo();
});

document.querySelector('.voltar').addEventListener('click', function () {
    document.getElementById('lerGabaritoDiv').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    window.scrollTo(0, 0);
    pararCamera(); // Parar a câmera ao voltar ao menu principal
});

function iniciarCamera(deviceId = null) {
    const video = document.getElementById('video');

    const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            currentStream = stream;
            currentDeviceId = deviceId;
            video.srcObject = stream;
            video.play();
        })
        .catch(function (err) {
            console.error("Erro ao acessar a câmera: ", err);
        });
}

function pararCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
}

document.getElementById('trocarCamera').addEventListener('click', function () {
    pararCamera();
    listarCameras();
});

function listarCameras() {
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length > 1) {
                const deviceIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
                const nextDeviceIndex = (deviceIndex + 1) % videoDevices.length;
                const nextDeviceId = videoDevices[nextDeviceIndex].deviceId;

                iniciarCamera(nextDeviceId);
            } else {
                alert('Apenas uma câmera disponível.');
                iniciarCamera();
            }
        })
        .catch(function (err) {
            console.error("Erro ao listar câmeras: ", err);
        });
}

// Processar vídeo ao vivo
function processarVideo() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    function processFrame() {
        if (!video.paused && !video.ended) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Agora processaremos a imagem capturada
            const status = processarImagem(canvas);

            // Atualizar o status na interface
            atualizarStatus(status);

            requestAnimationFrame(processFrame); // Processa o próximo frame
        }
    }

    requestAnimationFrame(processFrame); // Inicia o processamento contínuo
}
function processarImagem(canvas) {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let status = "Detectando marcas...";

    // Converter para escala de cinza e aplicar threshold
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(gray, binary, 150, 255, cv.THRESH_BINARY_INV);

    // Encontrar contornos na imagem binarizada
    cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let rects = [];
    let bolhas = [];
    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);
        const area = cv.contourArea(contour);

        // Filtrar potenciais marcadores e bolhas com base na área e proporção
        const aspectRatio = rect.width / rect.height;

        if (aspectRatio > 2 && aspectRatio < 5 && area > 1000) {
            // Potencial marcador (retângulo maior)
            rects.push(rect);
            cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), [0, 0, 255, 255], 2);
        } else if (aspectRatio >= 0.8 && aspectRatio <= 1.2 && area > 50 && area < 500) {
            // Potencial bolha (quase circular)
            bolhas.push(rect);

            // Verificar o percentual de área preenchida
            const bolhaPreenchida = verificarBolhaPreenchida(binary, rect);
            const color = bolhaPreenchida ? [0, 255, 0, 255] : [255, 0, 0, 255]; // Verde se preenchida, vermelho se não

            cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), color, 2);
        }
    }

    // Verificar se os quatro retângulos (marcadores) foram detectados
    if (rects.length === 4) {
        status = "Marcas detectadas com sucesso!";
        console.log("Marcas detectadas:", rects);
    } else {
        status = "Marcas não detectadas corretamente.";
        console.warn("Marcas não detectadas corretamente. Detectado:", rects.length);
    }

    // Exibir a imagem com as marcas e bolhas detectadas
    cv.imshow('canvas', src);

    // Liberação de memória
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();

    return status;
}

// Função para verificar se uma bolha está preenchida
function verificarBolhaPreenchida(binary, rect) {
    const roi = binary.roi(rect);
    const totalPixels = rect.width * rect.height;
    const filledPixels = cv.countNonZero(roi);
    roi.delete();

    const filledRatio = filledPixels / totalPixels;
    return filledRatio > 0.5; // Considera preenchido se mais de 50% dos pixels forem brancos
}

function warpImage(src, rects) {
    const width = 400;
    const height = 800;
    
    const dst = new cv.Mat();
    const dsize = new cv.Size(width, height);

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        rects[0].x, rects[0].y,
        rects[1].x + rects[1].width, rects[1].y,
        rects[2].x + rects[2].width, rects[2].y + rects[2].height,
        rects[3].x, rects[3].y + rects[3].height
    ]);

    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        width, 0,
        width, height,
        0, height
    ]);

    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    srcTri.delete();
    dstTri.delete();
    M.delete();

    return dst;
}

function atualizarStatus(mensagem) {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = mensagem;
    } else {
        console.error("Div de status não encontrada.");
    }
}

// Elemento de status na interface
const statusElement = document.createElement('div');
statusElement.id = 'status';
statusElement.style.marginTop = '10px';
statusElement.style.fontWeight = 'bold';
document.getElementById('lerGabaritoDiv').appendChild(statusElement);

function detectarBolhas(src) {
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(gray, binary, 150, 255, cv.THRESH_BINARY_INV);

    cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);

        // Desenhar um quadrado azul ao redor da área da bolha
        cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), [0, 0, 255, 255], 2);
    }

    cv.imshow('canvas', src);

    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
}
