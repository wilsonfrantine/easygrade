let video = document.getElementById('webcam');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d', {willReadFrequently: true});
let currentStream = null;
let patternDetected = false;
let resultsData = {}; // Armazenará os resultados para exportação

// Matriz OpenCV que precisa ser reutilizada no loop
let src, gray, thresh, contours, hierarchy;

async function onOpenCvReady() {
    const cameraSelect = document.getElementById('cameraSelect');
    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        cameraSelect.appendChild(option);
    });

    cameraSelect.addEventListener('change', () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        startCamera(cameraSelect.value);
    });

    if (videoDevices.length > 0) {
        startCamera(videoDevices[0].deviceId);
    }

    document.getElementById('acceptButton').addEventListener('click', acceptResult);
    document.getElementById('retryButton').addEventListener('click', retryDetection);
}

function startCamera(deviceId) {
    navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: deviceId
        }
    }).then(function(stream) {
        currentStream = stream;
        video.srcObject = stream;
        video.play();
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            initializeMats(); // Inicializar as matrizes OpenCV
            requestAnimationFrame(processVideo);
        };
    }).catch(function(error) {
        prompt("Erro ao acessar a webcam: ", error);
    });
}

function initializeMats() {
    // Inicializa as matrizes OpenCV
    src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    gray = new cv.Mat();
    thresh = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
}

function releaseMats() {
    // Libera os recursos das matrizes OpenCV
    if (src) src.delete();
    if (gray) gray.delete();
    if (thresh) thresh.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
}

function processVideo() {
    if (patternDetected) return;

    // Certifique-se de que src seja recriado com as mesmas dimensões do canvas
    if (!src || src.rows !== canvas.height || src.cols !== canvas.width) {
        if (src) {
            src.delete();  // Libera a matriz anterior se já estiver inicializada
        }
        src = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC4);  // Recria a matriz com as dimensões corretas
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Verifica se src.data tem o mesmo comprimento que imageData.data
    if (src.data.length !== imageData.data.length) {
        console.error("Tamanhos incompatíveis: src.data.length = " + src.data.length + ", imageData.data.length = " + imageData.data.length);
        return;  // Evitar erro se os tamanhos não coincidirem
    }

    src.data.set(imageData.data);  // Copiar os dados de imageData para src

    // Armazenar uma cópia da imagem original capturada do vídeo
    let originalFrame = src.clone();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 110, 255, cv.THRESH_BINARY);
    cv.findContours(thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    let rects = [];
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        let aspectRatio = rect.width / rect.height;
        if (rect.width > 25 && rect.width < 70 && rect.height > 9 && rect.height < 35 && aspectRatio > 1.5 && aspectRatio < 5.0) {
            rects.push(rect);
            cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), [0, 255, 0, 255], 2);
        }
    }

    let isPatternMatched = matchPattern(rects);

    if (isPatternMatched) {
        let alignedThresh = alignTemplate(thresh, rects);

        // Alinha a imagem original com base nos mesmos pontos de transformação
        let alignedColor = alignTemplate(originalFrame, rects);

        applyGrid(alignedThresh, alignedColor);

        // Mostrar a imagem original alinhada com pontos verdes
        cv.imshow('canvas', alignedColor);

        // Libera as imagens alinhadas da memória
        alignedColor.delete();
        alignedThresh.delete();
        patternDetected = true; // Interrompe o loop após desenhar o grid
    } else {
        document.getElementById('results').textContent = "Padrão não reconhecido.";
        cv.imshow('canvas', src);
    }

    if (!patternDetected) {
        originalFrame.delete();  // Liberar a memória usada pelo frame original
        requestAnimationFrame(processVideo);
    }
}



function alignTemplate(src, rects) {
    rects.sort((a, b) => a.y - b.y || a.x - b.x);

    const top_left = new cv.Point(rects[0].x, rects[0].y);
    const top_right = new cv.Point(rects[1].x + rects[1].width, rects[1].y);
    const bottom_left = new cv.Point(rects[2].x, rects[2].y + rects[2].height);
    const bottom_right = new cv.Point(rects[3].x + rects[3].width, rects[3].y + rects[3].height);

    const width = 600; // Proporção do gabarito
    const height = 800;

    let dst = new cv.Mat();
    let dsize = new cv.Size(width, height);

    let dst_points = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        width, 0,
        0, height,
        width, height
    ]);

    let src_points = cv.matFromArray(4, 1, cv.CV_32FC2, [
        top_left.x, top_left.y,
        top_right.x, top_right.y,
        bottom_left.x, bottom_left.y,
        bottom_right.x, bottom_right.y
    ]);

    let M = cv.getPerspectiveTransform(src_points, dst_points);
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    M.delete();
    src_points.delete();
    dst_points.delete();

    return dst;
}

function applyGrid(aligned, alignedColor) {
    const numRows = 14;
    const numCols = 5;

    // Calculando as margens com base nas dimensões da âncora
    const anchorHeight = aligned.rows / 800 * 100; // Supondo que a altura do gabarito seja de 800px
    const anchorWidth = aligned.cols / 600 * 100;  // Supondo que a largura do gabarito seja de 600px

    const marginTopBottom = 0.35 * anchorHeight;
    const marginLeft = 0.55 * anchorWidth;
    const marginRight = 1.1 * anchorWidth;

    // Dimensões internas do grid considerando as margens
    const gridWidth = aligned.cols - marginLeft - marginRight;
    const gridHeight = aligned.rows - 2 * marginTopBottom;

    const cellWidth = gridWidth / numCols;
    const cellHeight = gridHeight / numRows;

    resultsData = {}; // Resetando os dados

    for (let row = 0; row < numRows; row++) {
        let selectedOptions = [];
        resultsData[`Linha ${row + 1}`] = {};

        for (let col = 0; col < numCols; col++) {
            // Ajustando as posições das células do grid com as margens
            let x = Math.floor(marginLeft + col * cellWidth);
            let y = Math.floor(marginTopBottom + row * cellHeight);
            let cell = aligned.roi(new cv.Rect(x, y, Math.floor(cellWidth), Math.floor(cellHeight)));

            const filledPixels = cv.countNonZero(cell);
            const totalPixels = cell.rows * cell.cols;
            const fillRatio = filledPixels / totalPixels;

            const filled = fillRatio < 0.9; // Determina se a bolha foi marcada
            if (filled) {
                selectedOptions.push(`Coluna ${col + 1}`);
                resultsData[`Linha ${row + 1}`][`Coluna ${col + 1}`] = "Sim";

                // Desenha um ponto verde no centro da célula se estiver preenchida
                let centerX = x + Math.floor(cellWidth / 2);
                let centerY = y + Math.floor(cellHeight / 2);
                let radius = Math.min(cellWidth, cellHeight) / 4; // Raio do círculo

                cv.circle(alignedColor, new cv.Point(centerX, centerY), radius, [0, 255, 0, 255], -1);
            }

            cell.delete();
        }

        // Exibe apenas as alternativas selecionadas
        if (selectedOptions.length > 0) {
            let selectedText = `Linha ${row + 1}: ${selectedOptions.join(', ')}`;
            document.getElementById('results').textContent += selectedText + '\n';
        }
    }

    // Mostra a imagem colorida alinhada com pontos verdes sobre as bolhas preenchidas
    cv.imshow('canvas', alignedColor);
}



function drawAlignedToCanvas(aligned) {
    // Ajustar o canvas para a proporção correta do gabarito
    let aspectRatio = aligned.cols / aligned.rows;
    canvas.height = canvas.width / aspectRatio;

    // Desenha a imagem ajustada no canvas
    cv.imshow('canvas', aligned);
}

function matchPattern(rects) {
    if (rects.length !== 4) return false;

    rects.sort((a, b) => a.y - b.y || a.x - b.x);

    const top_left = rects[0];
    const top_right = rects[1];
    const bottom_left = rects[2];
    const bottom_right = rects[3];

    const widthThreshold = 30;
    const heightThreshold = 30;

    const correctTop = Math.abs(top_left.y - top_right.y) < heightThreshold;
    const correctBottom = Math.abs(bottom_left.y - bottom_right.y) < heightThreshold;
    const correctLeft = Math.abs(top_left.x - bottom_left.x) < widthThreshold;
    const correctRight = Math.abs(top_right.x - bottom_right.x) < widthThreshold;

    return correctTop && correctBottom && correctLeft && correctRight;
}

function acceptResult() {
    console.log("Resultados Aceitos: ", resultsData);
    // Exportar resultados como JSON
    const jsonResults = JSON.stringify(resultsData);
    console.log("JSON Exportado: ", jsonResults);

    // Aqui você pode adicionar lógica para salvar o JSON em um arquivo, enviar para um servidor, etc.
}

function retryDetection() {
    patternDetected = false;
    document.getElementById('results').innerHTML = "";
    releaseMats(); // Liberar as matrizes antigas
    initializeMats(); // Re-inicializar as matrizes
    requestAnimationFrame(processVideo);
}
