let questaoIndex = 1;
const maxAlternativas = 15;

document.getElementById('tipoQuestao').addEventListener('change', atualizarPrevisualizacao);
document.getElementById('numAlternativas').addEventListener('input', atualizarPrevisualizacao);

function atualizarPrevisualizacao() {
    const tipoQuestao = document.getElementById('tipoQuestao').value;
    const numAlternativas = document.getElementById('numAlternativas').value;

    const previsualizacaoDiv = document.getElementById('previsualizacaoQuestoes');
    previsualizacaoDiv.innerHTML = '';

    if (!numAlternativas && tipoQuestao !== 'discursiva') {
        return;
    }

    if (tipoQuestao === 'multipla') {
        document.getElementById('instrucaoSelecao').classList.remove('hidden');
        for (let i = 0; i < numAlternativas; i++) {
            let alt = document.createElement('label');
            alt.classList.add('alternativa');
            alt.innerHTML = `
                <input type="radio" name="alternativa" value="${i}">
                ${String.fromCharCode(65 + i)} <!-- A, B, C, etc. -->
            `;
            previsualizacaoDiv.appendChild(alt);
        }
    } else if (tipoQuestao === 'vf') {
        document.getElementById('instrucaoSelecao').classList.remove('hidden');
        for (let i = 0; i < numAlternativas; i++) {
            let alt = document.createElement('div');
            alt.classList.add('alternativa', 'vf');
            alt.innerHTML = `
                <span>${String.fromCharCode(65 + i)}:</span>
                <label>
                    <input type="radio" name="alternativa${i}" value="V">
                    V
                </label>
                <label>
                    <input type="radio" name="alternativa${i}" value="F">
                    F
                </label>
            `;
            previsualizacaoDiv.appendChild(alt);
        }
    } else if (tipoQuestao === 'discursiva') {
        document.getElementById('instrucaoSelecao').classList.add('hidden');
        let alt = document.createElement('div');
        alt.classList.add('alternativa');
        alt.textContent = `Q${questaoIndex}: Discursiva`;
        previsualizacaoDiv.appendChild(alt);
    }
}

// Evento para limitar o valor máximo no input de número de alternativas
document.getElementById('numAlternativas').addEventListener('input', function() {
    if (this.value > maxAlternativas) {
        this.value = maxAlternativas;
    }
});

document.getElementById('confirmarQuestao').addEventListener('click', function() {
    const tipoQuestao = document.getElementById('tipoQuestao').value;
    const numAlternativas = parseInt(document.getElementById('numAlternativas').value, 10);
    let corretaIndex = '';
    let corretaVF = [];

    if (tipoQuestao === 'multipla') {
        corretaIndex = [...document.querySelectorAll('input[name="alternativa"]:checked')].map(input => parseInt(input.value, 10));
        if (corretaIndex.length === 0) {
            alert('Selecione a alternativa correta.');
            return;
        }
    } else if (tipoQuestao === 'vf') {
        corretaVF = [...Array(numAlternativas).keys()].map(i => {
            const selecionada = document.querySelector(`input[name="alternativa${i}"]:checked`);
            return selecionada ? selecionada.value : null;
        });

        if (corretaVF.includes(null)) {
            alert('Selecione V ou F para todas as alternativas.');
            return;
        }
    }

    const questoesUl = document.getElementById('questoesUl');
    let li = document.createElement('li');
    li.setAttribute('data-key', `Q${questaoIndex}`);
    li.dataset.tipoQuestao = tipoQuestao;
    li.dataset.numAlternativas = numAlternativas;
    li.dataset.resposta = tipoQuestao === 'multipla' ? corretaIndex[0] : corretaVF.join(',');

    li.innerHTML = `
    <span class="questao-text">Q${questaoIndex}: ${tipoQuestao === 'discursiva' ? 'Discursiva' : tipoQuestao === 'multipla' ? 'Alternativas: ' + numAlternativas + ', Resposta: ' + String.fromCharCode(65 + corretaIndex[0]) : 'V/F, Resposta: ' + corretaVF.join(', ')}</span>
    <span class="move-up-btn material-icons">arrow_upward</span>
    <span class="move-down-btn material-icons">arrow_downward</span>
    <span class="remove-btn material-icons">delete</span>`;

    questoesUl.appendChild(li);

    questaoIndex++;
    atualizarNumerosQuestoes();
});

document.getElementById('questoesUl').addEventListener('click', function(e) {
    const li = e.target.closest('li');

    if (e.target.classList.contains('remove-btn')) {
        li.remove();
        atualizarNumerosQuestoes();
    } else if (e.target.classList.contains('move-up-btn')) {
        const prevLi = li.previousElementSibling;
        if (prevLi) {
            li.parentNode.insertBefore(li, prevLi);
            atualizarNumerosQuestoes();
        }
    } else if (e.target.classList.contains('move-down-btn')) {
        const nextLi = li.nextElementSibling;
        if (nextLi) {
            li.parentNode.insertBefore(nextLi, li);
            atualizarNumerosQuestoes();
        }
    }
});

function atualizarNumerosQuestoes() {
    const questoes = document.querySelectorAll('#questoesUl li');
    questoes.forEach((li, index) => {
        const key = `Q${index + 1}`;
        const questaoText = li.querySelector('.questao-text');
        questaoText.textContent = questaoText.textContent.replace(/Q\d+/, key);
        li.setAttribute('data-key', key);
    });
}

document.getElementById('gerarGabaritoFinal').addEventListener('click', function() {
    const questoes = document.querySelectorAll('#questoesUl li');
    const gabarito = {};

    questoes.forEach((li, index) => {
        const key = `Q${index + 1}`;
        gabarito[key] = {
            tipo: li.dataset.tipoQuestao,
            alternativas: parseInt(li.dataset.numAlternativas, 10), // Converte para inteiro
            resposta: parseInt(li.dataset.resposta, 10) // Converte para inteiro
        };
    });

    // Compactar o JSON
    const gabaritoJson = JSON.stringify(gabarito);
    const gabaritoCompactado = LZString.compressToEncodedURIComponent(gabaritoJson);

    // Tentativa de gerar QR code em um bloco try-catch para capturar erros de tamanho
    try {
        // Gerar o QR code a partir do JSON compactado
        const qrcodeDiv = document.createElement('div');
        qrcodeDiv.id = 'qrcode';
        document.getElementById('gabaritoOutput').appendChild(qrcodeDiv);

        new QRCode(qrcodeDiv, {
            text: gabaritoCompactado,
            width: 160,  // Ajuste o tamanho conforme necessário
            height: 160, // Ajuste o tamanho conforme necessário
            correctLevel: QRCode.CorrectLevel.H // Nível de correção de erro
        });

        // Adicionar botão de cópia para o QR code
        adicionarBotaoCopiaQR('qrcode');

        // Chamar a função para gerar o gabarito visual e exibi-lo
        gerarGabaritoVisual(gabarito);

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        alert('Erro: O gabarito é muito grande para ser armazenado no QR Code. Reduza o número de questões ou alternativas.');
        document.getElementById('gabaritoOutput').innerHTML = ""; // Limpa a saída em caso de erro
    }
});


function gerarGabaritoVisual(gabarito) {
    const gabaritoWidth = 400; // Largura do gabarito em pixels
    const gabaritoHeight = 800; // Altura do gabarito em pixels
    const maxBolhasPorLinha = 5;
    const maxLinhasPorFolha = 14; // Limite de 14 linhas por folha
    let folhaIndex = 1;

    let questaoIndex = 0;
    let linhaIndex = 1;

    const margemLateral = 20;
    const margemVertical = 20;

    criarNovaFolha(gabaritoWidth, gabaritoHeight, folhaIndex); // Garante que a primeira folha seja criada

    Object.keys(gabarito).forEach((key, index) => {
        const questao = gabarito[key];
        const numLinhasNecessarias = Math.ceil(questao.alternativas / maxBolhasPorLinha);

        // Verificar se é necessário criar uma nova folha antes de desenhar a próxima linha
        if (linhaIndex + numLinhasNecessarias > maxLinhasPorFolha) { 
            folhaIndex++;
            criarNovaFolha(gabaritoWidth, gabaritoHeight, folhaIndex);
            linhaIndex = 1; // Reiniciar a contagem de linhas na nova folha
        }

        const canvas = document.getElementById(`gabaritoCanvas${folhaIndex}`);
        const ctx = canvas.getContext('2d');

        const questaoText = key + ': ';
        const larguraBolha = 30;
        const alturaBolha = 30;
        const espacoEntreLinhas = 50;
        const espacoEntreBolhas = 25;
        const fontSize = 16;

        let y = margemVertical + (linhaIndex * espacoEntreLinhas);
        let x = margemLateral + 50;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(questaoText, margemLateral, y);

        if (questao.tipo === 'discursiva') {
            ctx.fillText('Discursiva', x, y);
            linhaIndex++;
        } else {
            for (let i = 0; i < questao.alternativas; i++) {
                const letra = String.fromCharCode(65 + i); // A, B, C, etc.
                if (i > 0 && i % maxBolhasPorLinha === 0) {
                    y += espacoEntreLinhas;
                    x = margemLateral + 50;
                    linhaIndex++;
                }

                // Desenhar a bolha
                ctx.beginPath();
                ctx.arc(x, y - alturaBolha / 2, larguraBolha / 2, 0, 2 * Math.PI);
                ctx.stroke();

                // Desenhar a letra dentro da bolha
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(letra, x - larguraBolha / 4, y - alturaBolha / 4);

                x += larguraBolha + espacoEntreBolhas;
            }
            linhaIndex++;
        }

        questaoIndex++;
    });

    // Adicionar botão de cópia para cada folha
    for (let i = 1; i <= folhaIndex; i++) {
        adicionarBotaoCopia(`gabaritoCanvas${i}`);
    }
}

function criarNovaFolha(width, height, folhaIndex) {
    const folhaDiv = document.createElement('div');
    folhaDiv.classList.add('folha');
    folhaDiv.id = `folha${folhaIndex}`;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.id = `gabaritoCanvas${folhaIndex}`;

    const ctx = canvas.getContext('2d');
    const margemLateral = 20;
    const margemVertical = 20;
    const rectWidth = 60;
    const rectHeight = 15;
    const rectMargin = margemLateral + rectWidth;

    // Desenhar a borda preta ao redor da folha
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;  // Define a espessura da borda da folha
    ctx.strokeRect(0, 0, width, height);

    // Definir a espessura da linha para os retângulos das bolhas
    ctx.lineWidth = 1;  // Espessura mais fina para as bolhas

    // Desenhar retângulos pretos nos quatro cantos
    desenharRetangulo(ctx, margemLateral, margemVertical); // Top-left
    desenharRetangulo(ctx, width - rectMargin, margemVertical); // Top-right
    desenharRetangulo(ctx, width - rectMargin, height - margemVertical - rectHeight); // Bottom-right
    desenharRetangulo(ctx, margemLateral, height - margemVertical - rectHeight); // Bottom-left

    // Adicionar o canvas gerado à div de folha
    folhaDiv.appendChild(canvas);

    // Adicionar a folhaDiv gerada à div de saída
    const gabaritoOutputDiv = document.getElementById('gabaritoOutput');
    gabaritoOutputDiv.appendChild(folhaDiv);
}

function desenharRetangulo(ctx, x, y) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, 60, 15);  // Desenha o retângulo sólido
    ctx.strokeRect(x, y, 60, 15);  // Desenha o contorno do retângulo
}

function desenharRetangulo(ctx, x, y) {
    const rectWidth = 60;
    const rectHeight = 15;
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, rectWidth, rectHeight); // Desenha um retângulo preto
}

// Função para adicionar botão de cópia
function adicionarBotaoCopia(canvasId) {
    const canvas = document.getElementById(canvasId);
    const botaoCopia = document.createElement('button');
    botaoCopia.innerHTML = `<span class="material-icons">content_copy</span> Copiar folha resposta`;
    botaoCopia.classList.add('copy-btn');

    botaoCopia.addEventListener('click', function() {
        canvas.toBlob(function(blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                alert('Folha copiada para a área de transferência!');
            }).catch(err => {
                console.error('Erro ao copiar a folha:', err);
            });
        });
    });

    canvas.parentNode.appendChild(botaoCopia);
}

// Função para adicionar botão de cópia para o QR code
function adicionarBotaoCopiaQR(qrcodeDivId) {
    const qrcodeDiv = document.getElementById(qrcodeDivId);
    const botaoCopiaQR = document.createElement('button');
    botaoCopiaQR.innerHTML = `<span class="material-icons">content_copy</span> Copiar QR Code`;

    botaoCopiaQR.classList.add('copy-btn');

    botaoCopiaQR.addEventListener('click', function() {
        const qrcodeCanvas = qrcodeDiv.querySelector('canvas');
        if (qrcodeCanvas) {
            qrcodeCanvas.toBlob(function(blob) {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    alert('QR Code copiado para a área de transferência!');
                }).catch(err => {
                    console.error('Erro ao copiar o QR Code:', err);
                });
            });
        } else {
            alert('QR Code não encontrado.');
        }
    });

    qrcodeDiv.appendChild(botaoCopiaQR);
}
