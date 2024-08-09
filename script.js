const video = document.getElementById('video');
const videoSource = document.getElementById('videoSource');
const cameraPermissionMsg = document.getElementById('camera-permission');

// Função para iniciar o streaming de vídeo da câmera
function startVideoStream(deviceId = null) {
    const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            cameraPermissionMsg.style.display = 'none';
        })
        .catch(err => {
            console.error("Erro ao acessar a câmera: ", err);
            cameraPermissionMsg.style.display = 'block';
        });
}

// Popula a lista de dispositivos de vídeo disponíveis
function getVideoDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            videoSource.innerHTML = '';
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Câmera ${videoSource.length + 1}`;
                videoSource.appendChild(option);
            });

            if (videoDevices.length > 0) {
                startVideoStream(videoDevices[0].deviceId); // Inicia com o primeiro dispositivo
            }
        })
        .catch(err => {
            console.error("Erro ao listar dispositivos: ", err);
        });
}

// Troca a câmera ao selecionar outro dispositivo
videoSource.addEventListener('change', function() {
    startVideoStream(videoSource.value);
});

// Inicializa a lista de dispositivos de vídeo e solicita permissão
getVideoDevices();

// Captura a foto quando o botão é clicado
const canvas = document.getElementById('gabaritoCanvas');
const ctx = canvas.getContext('2d');
const snapButton = document.getElementById('snap');

snapButton.addEventListener('click', function() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
});

// Processar a imagem capturada
document.getElementById('processButton').addEventListener('click', function() {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convertendo a imagem para escala de cinza
    cv['onRuntimeInitialized']=()=>{
        let src = cv.matFromImageData(imageData);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Thresholding para binarização
        let thresh = new cv.Mat();
        cv.threshold(gray, thresh, 128, 255, cv.THRESH_BINARY);

        // Detecção de círculos (representando bolhas de respostas)
        let circles = new cv.Mat();
        cv.HoughCircles(thresh, circles, cv.HOUGH_GRADIENT, 1, 20, 100, 30, 10, 30);

        for (let i = 0; i < circles.cols; ++i) {
            let x = circles.data32F[i * 3];
            let y = circles.data32F[i * 3 + 1];
            let radius = circles.data32F[i * 3 + 2];
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        cv.imshow('gabaritoCanvas', thresh);
        src.delete(); gray.delete(); thresh.delete(); circles.delete();
    }
});