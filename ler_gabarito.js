let currentStream = null;
let currentDeviceId = null;
let processing = false;
let frameInterval = 500;
let gabaritoInfo = null; // Variável para armazenar as informações do gabarito após a leitura do QR Code

document.getElementById('lerGabarito').addEventListener('click', function () {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('lerGabaritoDiv').classList.remove('hidden');
    window.scrollTo(0, 0);
    iniciarCamera();
    processarVideo();
});

document.querySelectorAll('.voltar').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.getElementById('lerGabaritoDiv').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        window.scrollTo(0, 0);
        pararCamera();
        gabaritoInfo = null; // Reiniciar as informações do gabarito
    });
});

async function iniciarCamera(deviceId = null) {
    try {
        const video = document.getElementById('video');
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                deviceId: deviceId ? { exact: deviceId } : undefined
            }
        };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentDeviceId = deviceId;
        video.srcObject = currentStream;
        await video.play();
        console.log('Câmera iniciada com sucesso');
    } catch (err) {
        console.error("Erro ao acessar a câmera: ", err);
        atualizarStatus('Erro ao acessar a câmera. Verifique as permissões.');
    }
}

function pararCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        console.log('Câmera parada');
    }
}

document.getElementById('trocarCamera').addEventListener('click', function () {
    pararCamera();
    listarCameras();
});

async function listarCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
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
    } catch (err) {
        console.error("Erro ao listar câmeras: ", err);
    }
}

function processarVideo() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    setInterval(() => {
        if (!video.paused && !video.ended) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const status = processarImagem(canvas);

            atualizarStatus(status);
        }
    }, frameInterval);
}

function processarImagem(canvas) {
    console.log('processarImagem foi chamado');

    const src = cv.imread(canvas);
    let status = "Procurando pelo QR Code...";

    if (!gabaritoInfo) {
        // Passo 1: Procurar pelo QR Code
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = src.cols;
        dstCanvas.height = src.rows;
        cv.imshow(dstCanvas, src);
        const dstContext = dstCanvas.getContext('2d');
        const imageData = dstContext.getImageData(0, 0, dstCanvas.width, dstCanvas.height);

        // Usar jsQR para detectar o QR Code
        const qrCodeData = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCodeData) {
            console.log('QR Code detectado:', qrCodeData.data);
            // Decodificar o QR Code
            const gabaritoCompactado = qrCodeData.data;
            const gabaritoJson = LZString.decompressFromEncodedURIComponent(gabaritoCompactado);
            gabaritoInfo = JSON.parse(gabaritoJson);

            status = "QR Code detectado e gabarito carregado!";
        } else {
            status = "Procurando pelo QR Code...";
        }
    } else {
        // Passo 2: Procurar pelo gabarito (cartão de respostas)
        status = "Procurando pelo cartão de respostas...";

        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const binary = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();

        // Pré-processamento da imagem
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

        // Exibir a imagem binarizada para depuração
        cv.imshow('canvasBinary', binary);

        // Encontrar contornos
        cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        console.log('Número de contornos encontrados:', contours.size());

        let largestContour = null;
        let maxArea = 0;

        // Encontrar o contorno com a maior área (presumivelmente o cartão de resposta)
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            console.log(`Contorno ${i}: Área = ${area}`);

            if (area > maxArea) {
                maxArea = area;
                largestContour = contour;
            }
        }

        if (largestContour && maxArea > 10000) { // Verificar se o contorno é grande o suficiente
            // Desenhar o contorno maior para visualização
            let contoursToDraw = new cv.MatVector();
            contoursToDraw.push_back(largestContour);
            cv.drawContours(src, contoursToDraw, -1, [0, 255, 0, 255], 3);
            contoursToDraw.delete();

            cv.imshow('canvas', src);

            // Aproximar o contorno para um polígono
            const peri = cv.arcLength(largestContour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(largestContour, approx, 0.02 * peri, true);

            console.log('Número de vértices do contorno aproximado:', approx.rows);

            if (approx.rows === 4) {
                // Ordenar os pontos do polígono
                const corners = [];
                for (let i = 0; i < 4; i++) {
                    corners.push({
                        x: approx.data32S[i * 2],
                        y: approx.data32S[i * 2 + 1]
                    });
                }

                console.log('Pontos do contorno aproximado:', corners);

                const orderedCorners = ordenarPontos(corners);

                console.log('Pontos ordenados:', orderedCorners);

                // Aplicar transformação de perspectiva
                const dst = new cv.Mat();
                const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    orderedCorners[0].x, orderedCorners[0].y,
                    orderedCorners[1].x, orderedCorners[1].y,
                    orderedCorners[2].x, orderedCorners[2].y,
                    orderedCorners[3].x, orderedCorners[3].y
                ]);

                const width = 500; // Largura desejada do cartão de resposta transformado
                const height = 700; // Altura desejada do cartão de resposta transformado

                const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    0, 0,
                    width - 1, 0,
                    width - 1, height - 1,
                    0, height - 1
                ]);

                const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
                cv.warpPerspective(src, dst, M, new cv.Size(width, height));

                // Exibir a imagem transformada para depuração
                cv.imshow('canvasTransformada', dst);

                // Chamar a função de processamento do gabarito com as informações obtidas do QR Code
                processarGabarito(dst, gabaritoInfo);

                // Liberar matrizes
                dst.delete();
                srcCoords.delete();
                dstCoords.delete();
                M.delete();
                approx.delete();

                status = "Cartão de respostas processado com sucesso!";
            } else {
                status = "Contorno principal não é um quadrilátero.";
                console.log(status);
                approx.delete();
            }
        } else {
            status = "Cartão de resposta não encontrado.";
            console.log(status);
        }

        // Liberação de memória
        gray.delete();
        blurred.delete();
        binary.delete();
        contours.delete();
        hierarchy.delete();
    }

    // Liberação de memória
    src.delete();

    return status;
}

function ordenarPontos(points) {
    // Ordenar pontos em ordem específica: top-left, top-right, bottom-right, bottom-left
    // Baseado nas coordenadas x e y

    // Ordenar por y (top to bottom)
    points.sort((a, b) => a.y - b.y);

    const topPoints = points.slice(0, 2);
    const bottomPoints = points.slice(2, 4);

    // Ordenar os pontos superiores por x (left to right)
    topPoints.sort((a, b) => a.x - b.x);
    const topLeft = topPoints[0];
    const topRight = topPoints[1];

    // Ordenar os pontos inferiores por x (left to right)
    bottomPoints.sort((a, b) => a.x - b.x);
    const bottomLeft = bottomPoints[0];
    const bottomRight = bottomPoints[1];

    return [topLeft, topRight, bottomRight, bottomLeft];
}

function atualizarStatus(mensagem) {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = mensagem;
    }
}
