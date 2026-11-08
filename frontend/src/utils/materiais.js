// Área de Materiais: PDFs originais, produzidos para este projeto e guardados em public/materiais/.
// Para acrescentar um material: coloque o PDF em public/materiais/ e inclua uma linha em "materiais".
//
// A lista segue a progressão da trilha (letras, sílabas, palavras, frases e textos curtos) e cada
// material pertence a um "eixo" de conteúdo. Os eixos e essa progressão tomam como referência o guia
// citado abaixo. Os PDFs NÃO são cópia nem adaptação das fichas desse site.

export const REFERENCIA = {
    titulo: 'Atividades de alfabetização para imprimir em PDF',
    veiculo: 'Via Carreira',
    url: 'https://viacarreira.com/atividades-de-alfabetizacao-para-imprimir-em-pdf/'
};

// "categoria" é o tipo de atividade (filtros da página); "eixo" é o conteúdo trabalhado.
export const CATEGORIAS = ['Todas', 'Para Imprimir', 'Colorir','Recortar'];

export const kitDaSemana = {
    titulo: 'Caderno BA-BE-BI completo',
    eixo: 'Consoantes e famílias silábicas',
    descricao: 'Páginas com traçado, colagem e leitura em voz alta, no ritmo da trilha de',
    arquivo: '/materiais/caderno-ba-be-bi.pdf',
    pagina: 22,
};

export const materiais = [
    { id: 'caligrafia-vogais', icone: '▤', titulo: 'Caligrafia das vogais', eixo: 'Alfabeto e vogais', paginas: 8, tom: 'orange', categoria: 'Para Imprimir', arquivo: '/materiais/caligrafia-das-vogais.pdf' },
    { id: 'pinte-letra-inicial', icone: '🎨', titulo: 'Pinte a letra inicial', eixo: 'Alfabeto e vogais', paginas: 12, tom: 'yellow', categoria: 'Colorir', arquivo: '/materiais/pinte-a-letra-inicial.pdf' },
    { id: 'alfabeto-movel', icone: '✂', titulo: 'Alfabeto móvel', eixo: 'Alfabeto e vogais', paginas: 3, tom: 'orange', categoria: 'Recortar', arquivo: '/materiais/alfabeto-movel.pdf' },
    { id: 'recorte-silabas', icone: '✂', titulo: 'Recorte e cole: sílabas', eixo: 'Sílabas e formação de palavras', paginas: 6, tom: 'blue', categoria: 'Recortar', arquivo: '/materiais/recorte-e-cole-silabas.pdf' },
    { id: 'rimas-silabas', icone: '▤', titulo: 'Rimas e sílabas', eixo: 'Consciência fonológica', paginas: 5, tom: 'yellow', categoria: 'Para Imprimir', arquivo: '/materiais/rimas-e-silabas.pdf' },
    { id: 'monte-frase', icone: '✂', titulo: 'Monte a frase', eixo: 'Formação de frases e escrita', paginas: 5, tom: 'orange', categoria: 'Recortar', arquivo: '/materiais/monte-a-frase.pdf' },
    { id: 'leia-responda', icone: '▤', titulo: 'Leia e responda', eixo: 'Leitura e interpretação de textos curtos', paginas: 5, tom: 'blue', categoria: 'Para Imprimir', arquivo: '/materiais/leia-e-responda.pdf' },
    { id: 'cruzadinha-animais', icone: '▤', titulo: 'Cruzadinha de animais', eixo: 'Atividades lúdicas', paginas: 4, tom: 'blue', categoria: 'Para Imprimir', arquivo: '/materiais/cruzadinha-de-animais.pdf' },
];