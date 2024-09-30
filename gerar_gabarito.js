let questaoIndex = 1;
const maxAlternativas = 15;

document.getElementById('tipoQuestao').addEventListener('change', atualizarPrevisualizacao);
document.getElementById('numAlternativas').addEventListener('input', atualizarPrevisualizacao);

function atualizarPrevisualizacao() {
    const tipoQuestao = document.getElementById('tipoQuestao').value;
    const numAlternativas = parseInt(document.getElementById('numAlternativas').value, 10);

    const previsualizacaoDiv = document.getElementById('previsualizacaoQuestoes');
    previsualizacaoDiv.innerHTML = '';

    limparMensagemErro();

    if (tipoQuestao !== 'discursiva' && (!numAlternativas || numAlternativas < 2 || numAlternativas > maxAlternativas)) {
        mostrarMensagemErro('Por favor, insira um número válido de alternativas (2 a ' + maxAlternativas + ').');
        return;
    }

    if (tipoQuestao === 'multipla') {
        document.getElementById('instrucaoSelecao').classList.remove('hidden');
        for (let i = 0; i < numAlternativas; i++) {
            let alt = document.createElement('label');
            alt.classList.add('alternativa');
            alt.innerHTML = `
                <input type="radio" name="alternativa" value="${i}">
                ${String.fromCharCode(65 + i)}
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
        const selecionada = document.querySelector('input[name="alternativa"]:checked');
        if (!selecionada) {
            mostrarMensagemErro('Selecione a alternativa correta.');
            return;
        }
        corretaIndex = parseInt(selecionada.value, 10);
    } else if (tipoQuestao === 'vf') {
        for (let i = 0; i < numAlternativas; i++) {
            const selecionada = document.querySelector(`input[name="alternativa${i}"]:checked`);
            if (!selecionada) {
                mostrarMensagemErro('Selecione V ou F para todas as alternativas.');
                return;
            }
            corretaVF.push(selecionada.value);
        }
    }

    adicionarQuestao(tipoQuestao, numAlternativas, corretaIndex, corretaVF);

    document.getElementById('questaoForm').reset();
    document.getElementById('previsualizacaoQuestoes').innerHTML = '';
    document.getElementById('instrucaoSelecao').classList.add('hidden');
    limparMensagemErro();
});

function adicionarQuestao(tipoQuestao, numAlternativas, corretaIndex, corretaVF) {
    const questoesUl = document.getElementById('questoesUl');
    let li = document.createElement('li');
    li.setAttribute('data-key', `Q${questaoIndex}`);
    li.dataset.tipoQuestao = tipoQuestao;
    li.dataset.numAlternativas = numAlternativas;
    li.dataset.resposta = tipoQuestao === 'multipla' ? corretaIndex : corretaVF.join(',');
    li.dataset.questaoIndex = questaoIndex;

    let questaoDescricao = '';

    if (tipoQuestao === 'multipla') {
        questaoDescricao = `Alternativas: ${numAlternativas}, Resposta: ${String.fromCharCode(65 + corretaIndex)}`;
    } else if (tipoQuestao === 'vf') {
        questaoDescricao = `V/F, Resposta: ${corretaVF.join(', ')}`;
    } else if (tipoQuestao === 'discursiva') {
        questaoDescricao = 'Discursiva';
    }

    li.innerHTML = `
    <span class="questao-text">Q${questaoIndex}: ${questaoDescricao}</span>
    <span class="edit-btn material-icons" aria-label="Editar Questão">edit</span>
    <span class="move-up-btn material-icons" aria-label="Mover para Cima">arrow_upward</span>
    <span class="move-down-btn material-icons" aria-label="Mover para Baixo">arrow_downward</span>
    <span class="remove-btn material-icons" aria-label="Remover Questão">delete</span>`;

    questoesUl.appendChild(li);

    questaoIndex++;
    atualizarNumerosQuestoes();
}

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
    } else if (e.target.classList.contains('edit-btn')) {
        editarQuestao(li);
    }
});

function atualizarNumerosQuestoes() {
    const questoes = document.querySelectorAll('#questoesUl li');
    questoes.forEach((li, index) => {
        const key = `Q${index + 1}`;
        const questaoText = li.querySelector('.questao-text');
        questaoText.textContent = questaoText.textContent.replace(/Q\d+/, key);
        li.setAttribute('data-key', key);
        li.dataset.questaoIndex = index + 1;
    });
}

function editarQuestao(li) {
    const tipoQuestao = li.dataset.tipoQuestao;
    const numAlternativas = parseInt(li.dataset.numAlternativas, 10);
    const resposta = li.dataset.resposta.split(',');

    document.getElementById('tipoQuestao').value = tipoQuestao;
    document.getElementById('numAlternativas').value = numAlternativas;
    atualizarPrevisualizacao();

    if (tipoQuestao === 'multipla') {
        document.querySelector(`input[name="alternativa"][value="${resposta[0]}"]`).checked = true;
    } else if (tipoQuestao === 'vf') {
        for (let i = 0; i < numAlternativas; i++) {
            document.querySelector(`input[name="alternativa${i}"][value="${resposta[i]}"]`).checked = true;
        }
    }

    li.remove();
    atualizarNumerosQuestoes();
}

document.getElementById('gerarGabaritoFinal').addEventListener('click', function() {
    mostrarSpinner();
    setTimeout(() => {
        const questoes = document.querySelectorAll('#questoesUl li');
        const gabarito = {};

        questoes.forEach((li, index) => {
            const key = `Q${index + 1}`;
            const tipoQuestao = li.dataset.tipoQuestao;
            const numAlternativas = parseInt(li.dataset.numAlternativas, 10);
            const resposta = tipoQuestao === 'multipla' ? parseInt(li.dataset.resposta, 10) : li.dataset.resposta;

            gabarito[key] = {
                tipo: tipoQuestao,
                alternativas: numAlternativas,
                resposta: resposta
            };
        });

        const gabaritoJson = JSON.stringify(gabarito);
        const gabaritoCompactado = LZString.compressToEncodedURIComponent(gabaritoJson);

        try {
            const qrcodeDiv = document.createElement('div');
            qrcodeDiv.id = 'qrcode';
            document.getElementById('gabaritoOutput').appendChild(qrcodeDiv);

            new QRCode(qrcodeDiv, {
                text: gabaritoCompactado,
                width: 160,
                height: 160,
                correctLevel: QRCode.CorrectLevel.H
            });

            adicionarBotaoCopiaQR('qrcode');

            gerarGabaritoVisual(gabarito);

        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            alert('Erro: O gabarito é muito grande para ser armazenado no QR Code. Reduza o número de questões ou alternativas.');
            document.getElementById('gabaritoOutput').innerHTML = '';
        } finally {
            esconderSpinner();
        }
    }, 500);
});

function gerarGabaritoVisual(gabarito) {
    const gabaritoWidth = 400;
    const gabaritoHeight = 800;
    const maxBolhasPorLinha = 5;
    const maxLinhasPorFolha = 14;
    let folhaIndex = 1;
    let linhaIndex = 1;

    criarNovaFolha(gabaritoWidth, gabaritoHeight, folhaIndex);

    Object.keys(gabarito).forEach((key) => {
        const questao = gabarito[key];
        const numLinhasNecessarias = questao.tipo === 'discursiva' ? 1 : Math.ceil(questao.alternativas / maxBolhasPorLinha);

        if (linhaIndex + numLinhasNecessarias > maxLinhasPorFolha) {
            folhaIndex++;
            criarNovaFolha(gabaritoWidth, gabaritoHeight, folhaIndex);
            linhaIndex = 1;
        }

        const canvas = document.getElementById(`gabaritoCanvas${folhaIndex}`);
        const ctx = canvas.getContext('2d');

        const questaoText = key + ': ';
        const larguraBolha = 30;
        const alturaBolha = 30;
        const espacoEntreLinhas = 50;
        const espacoEntreBolhas = 25;
        const fontSize = 16;
        const margemLateral = 20;
        const margemVertical = 20;

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
                const letra = String.fromCharCode(65 + i);
                if (i > 0 && i % maxBolhasPorLinha === 0) {
                    y += espacoEntreLinhas;
                    x = margemLateral + 50;
                    linhaIndex++;
                }

                ctx.beginPath();
                ctx.arc(x, y - alturaBolha / 2, larguraBolha / 2, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(letra, x - larguraBolha / 4, y - alturaBolha / 4);

                x += larguraBolha + espacoEntreBolhas;
            }
            linhaIndex++;
        }
    });

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

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, width, height);

    desenharRetangulo(ctx, margemLateral, margemVertical);
    desenharRetangulo(ctx, width - margemLateral - 60, margemVertical);
    desenharRetangulo(ctx, width - margemLateral - 60, height - margemVertical - 15);
    desenharRetangulo(ctx, margemLateral, height - margemVertical - 15);

    folhaDiv.appendChild(canvas);
    const gabaritoOutputDiv = document.getElementById('gabaritoOutput');
    gabaritoOutputDiv.appendChild(folhaDiv);
}

function desenharRetangulo(ctx, x, y) {
    const rectWidth = 60;
    const rectHeight = 15;
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, rectWidth, rectHeight);
}

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

function mostrarMensagemErro(mensagem) {
    const erroDiv = document.getElementById('mensagemErro');
    erroDiv.textContent = mensagem;
    erroDiv.style.display = 'block';
}

function limparMensagemErro() {
    const erroDiv = document.getElementById('mensagemErro');
    erroDiv.textContent = '';
    erroDiv.style.display = 'none';
}

function mostrarSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'spinner';
    spinner.classList.add('spinner');
    document.body.appendChild(spinner);
}

function esconderSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.remove();
    }
}
