function processarGabarito(dst, gabarito) {
    const width = dst.cols;
    const height = dst.rows;

    // Gerar a grade com base no gabarito
    const posicoes = gerarGrade(gabarito, width, height);

    // Processar as respostas
    const respostas = processarRespostas(dst, posicoes);

    // Exibir ou armazenar as respostas
    console.log(respostas);

    // Opcional: Atualizar a interface do usuário com as respostas
}

function gerarGrade(gabarito, width, height) {
    const posicoes = [];
    const margemLateral = 50; // Margem em pixels
    const margemVertical = 50;
    const espacoEntreLinhas = 50;
    const espacoEntreColunas = 50;
    const raioBolha = 15;

    let y = margemVertical;

    Object.keys(gabarito).forEach((key) => {
        const questao = gabarito[key];
        const numAlternativas = questao.alternativas;

        let x = margemLateral;

        for (let i = 0; i < numAlternativas; i++) {
            posicoes.push({
                x: x,
                y: y,
                questao: key,
                alternativa: i
            });
            x += espacoEntreColunas;
        }
        y += espacoEntreLinhas;
    });

    return posicoes;
}

function processarRespostas(dst, posicoes) {
    const respostas = {};

    posicoes.forEach(pos => {
        const roiRect = new cv.Rect(pos.x - 15, pos.y - 15, 30, 30); // ROI ao redor da bolha

        // Verificar se o ROI está dentro dos limites da imagem
        if (roiRect.x >= 0 && roiRect.y >= 0 && roiRect.x + roiRect.width <= dst.cols && roiRect.y + roiRect.height <= dst.rows) {
            const roi = dst.roi(roiRect);

            // Converter para escala de cinza e aplicar threshold
            const roiGray = new cv.Mat();
            cv.cvtColor(roi, roiGray, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(roiGray, roiGray, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

            // Contar pixels brancos (marcas preenchidas terão mais pixels brancos)
            const nonZero = cv.countNonZero(roiGray);

            // Decidir se a bolha está marcada com base no número de pixels brancos
            const marcado = nonZero > 500; // Valor de limiar a ajustar

            if (marcado) {
                if (!respostas[pos.questao]) {
                    respostas[pos.questao] = [];
                }
                respostas[pos.questao].push(String.fromCharCode(65 + pos.alternativa));
            }

            // Liberar matrizes
            roi.delete();
            roiGray.delete();
        }
    });

    return respostas;
}
