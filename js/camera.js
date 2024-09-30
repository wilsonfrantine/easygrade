let videoElement = document.getElementById('videoElement');
let canvas = document.getElementById('videoCanvas');
let ctx = canvas.getContext('2d');
let selectedDeviceId = null;

// Função para listar as câmeras disponíveis e selecionar a default
function listCameras() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const cameraList = document.getElementById('cameraList');

        cameraList.innerHTML = ''; // Limpa a lista de câmeras

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Câmera ${index + 1}`;
            cameraList.appendChild(option);
        });

        if (videoDevices.length > 0) {
            const defaultCamera = videoDevices.find(device => device.label.toLowerCase().includes('default')) || videoDevices[0];
            selectedDeviceId = defaultCamera.deviceId;
            cameraList.value = selectedDeviceId;
            startCamera(selectedDeviceId);
        }
    });
}

// Função para iniciar a câmera
function startCamera(deviceId) {
    if (deviceId) {
        navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: { exact: deviceId }
            }
        })
        .then(stream => {
            videoElement.srcObject = stream;
            videoElement.play();

            videoElement.addEventListener('loadedmetadata', () => {
                adjustCanvasSize();
                processVideo();
            });
        })
        .catch(error => {
            document.getElementById('statusMessage').innerText = 'Erro ao acessar a câmera: ' + error.message;
        });
    }
}

// Ajusta o tamanho do canvas para se adaptar à proporção do vídeo
function adjustCanvasSize() {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
}

// Desenha o vídeo no canvas
function processVideo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(processVideo);  // Continue processando o vídeo
}

// Alterar a câmera manualmente
document.getElementById('cameraList').addEventListener('change', (event) => {
    selectedDeviceId = event.target.value;
    startCamera(selectedDeviceId);
});

// Inicializa a lista de câmeras ao carregar a página
listCameras();
