"""Gera os PDFs da área de Materiais do Clubinho ABC (A4, para imprimir).

Uso único: os PDFs gerados ficam em public/materiais/ e são arquivos estáticos
do projeto. Este script NÃO faz parte do projeto (reportlab não é dependência).
"""

import os
import random

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

SAIDA = os.environ.get('SAIDA_MATERIAIS', '/home/claude/ClubinhoABC/public/materiais')
W, H = A4
M = 42                      #margem lateral
TOPO = H - 138              #onde o conteúdo começa (abaixo do cabeçalho)
BASE = 58                   #onde o conteúdo termina (acima do rodapé)

ROSA = HexColor('#ED1766')
MARROM = HexColor('#4B2C1F')
TEXTO = HexColor('#6B4A3A')
AZUL = HexColor('#5570B7')
AMARELO = HexColor('#FFD84D')
CINZA = HexColor('#9A9A9A')
CINZA_CLARO = HexColor('#CFCFCF')
CREME = HexColor('#FFF4E4')
VERDE_CLARO = HexColor('#E7F7E5')
ROSA_CLARO = HexColor('#FDE3EC')
AZUL_CLARO = HexColor('#E3EAF8')

BOLD = 'Helvetica-Bold'
NORMAL = 'Helvetica'

#palavras do jogo do alfabeto do app (letra, palavra, artigo + palavra)
ALFABETO = [
    ('A', 'ABELHA', 'uma abelha'), ('B', 'BOLA', 'uma bola'), ('C', 'CASA', 'uma casa'),
    ('D', 'DADO', 'um dado'), ('E', 'ELEFANTE', 'um elefante'), ('F', 'FOCA', 'uma foca'),
    ('G', 'GATO', 'um gato'), ('L', 'LUA', 'a lua'), ('M', 'MACACO', 'um macaco'),
    ('P', 'PATO', 'um pato'), ('S', 'SOL', 'o sol'), ('U', 'UVA', 'uma uva'),
]


#estrutura do documento
class Documento:
    def __init__(self, arquivo, titulo, eixo):
        self.arquivo, self.titulo, self.eixo, self.paginas = arquivo, titulo, eixo, []

    def pagina(self, titulo, instrucao, desenhar, com_cabecalho=True):
        self.paginas.append((titulo, instrucao, desenhar, com_cabecalho))

    def salvar(self):
        os.makedirs(SAIDA, exist_ok=True)
        c = canvas.Canvas(os.path.join(SAIDA, self.arquivo), pagesize=A4)
        c.setTitle(self.titulo)
        c.setAuthor('Clubinho ABC')
        c.setSubject('Material para imprimir - alfabetização')
        total = len(self.paginas)
        for numero, (titulo, instrucao, desenhar, com_cabecalho) in enumerate(self.paginas, start=1):
            if com_cabecalho:
                cabecalho(c, titulo, instrucao)
            desenhar(c)
            if com_cabecalho:  # capa e diploma ficam sem rodapé
                rodape(c, numero, total, self.eixo)
            c.showPage()
        c.save()
        return total


def cabecalho(c, titulo, instrucao):
    c.setFillColor(ROSA)
    c.setFont(BOLD, 10)
    c.drawString(M, H - 32, 'CLUBINHO ABC')
    c.setFillColor(TEXTO)
    c.setFont(NORMAL, 10)
    c.drawRightString(W - M, H - 32, 'Nome: ______________________________   Data: ___/___/_____')
    c.setFillColor(MARROM)
    c.setFont(BOLD, 25)
    c.drawString(M, H - 68, titulo)
    c.setFillColor(TEXTO)
    c.setFont(NORMAL, 11.5)
    y = H - 90
    for linha in simpleSplit(instrucao, NORMAL, 11.5, W - 2 * M):
        c.drawString(M, y, linha)
        y -= 15
    c.setStrokeColor(ROSA)
    c.setLineWidth(1.6)
    c.line(M, H - 120, W - M, H - 120)


def rodape(c, numero, total, eixo):
    c.setFillColor(CINZA)
    c.setFont(NORMAL, 8.5)
    c.drawString(M, 28, f'Clubinho ABC · Material original · Eixo: {eixo}')
    c.drawRightString(W - M, 28, f'página {numero} de {total}')


#desenho básico
def texto_contorno(c, texto, x, y, tamanho, tracejado=True, cor=MARROM, largura=1.3, preenchimento=None, fonte=BOLD):
    """Letra só com o contorno (tracejado para a criança cobrir, ou contínuo para pintar)."""
    c.saveState()
    c.setStrokeColor(cor)
    c.setLineWidth(largura)
    if tracejado:
        c.setDash(3, 3)
    t = c.beginText(x, y)
    t.setFont(fonte, tamanho)
    if preenchimento is not None:
        c.setFillColor(preenchimento)
        t.setTextRenderMode(2)
    else:
        t.setTextRenderMode(1)
    t.textOut(texto)
    c.drawText(t)
    c.restoreState()


def pauta(c, x, y, largura, tamanho):
    """Linhas de caligrafia: base, meio (tracejada) e altura das maiúsculas."""
    c.saveState()
    c.setLineWidth(0.9)
    c.setStrokeColor(CINZA)
    c.line(x, y, x + largura, y)
    c.setStrokeColor(CINZA_CLARO)
    c.line(x, y + tamanho * 0.72, x + largura, y + tamanho * 0.72)
    c.setDash(3, 3)
    c.line(x, y + tamanho * 0.37, x + largura, y + tamanho * 0.37)
    c.restoreState()


def fileira_tracejada(c, itens, y, tamanho, passo):
    pauta(c, M, y, W - 2 * M, tamanho)
    for i, item in enumerate(itens):
        texto_contorno(c, item, M + 8 + i * passo, y, tamanho)


def centro(c, texto, x, y, tamanho, fonte=BOLD, cor=MARROM):
    c.setFillColor(cor)
    c.setFont(fonte, tamanho)
    c.drawCentredString(x, y, texto)


def caixa_tracejada(c, x, y, w, h, tesoura=True):
    c.saveState()
    c.setStrokeColor(CINZA)
    c.setLineWidth(1)
    c.setDash(5, 4)
    c.rect(x, y, w, h)
    c.restoreState()
    if tesoura:
        desenhar_tesoura(c, x + 6, y + h - 12)


def desenhar_tesoura(c, x, y):
    """Tesoura simples: duas lâminas cruzadas e dois aros."""
    c.saveState()
    c.setStrokeColor(CINZA)
    c.setLineWidth(1.2)
    c.line(x + 2, y + 3, x + 14, y - 5)
    c.line(x + 2, y - 5, x + 14, y + 3)
    c.circle(x, y + 4, 2.6, stroke=1, fill=0)
    c.circle(x, y - 6, 2.6, stroke=1, fill=0)
    c.restoreState()


def quadradinho(c, x, y, lado=14):
    c.setStrokeColor(MARROM)
    c.setLineWidth(1.2)
    c.rect(x, y, lado, lado)


def linha_escrita(c, x, y, largura):
    c.setStrokeColor(CINZA)
    c.setLineWidth(0.9)
    c.line(x, y, x + largura, y)


#1) CALIGRAFIA DAS VOGAIS (8 págs)
VOGAIS = [('A', 'a', 'ABELHA'), ('E', 'e', 'ELEFANTE'), ('I', 'i', 'IGREJA'), ('O', 'o', 'OVO'), ('U', 'u', 'UVA')]
CORES_VOGAIS = [ROSA_CLARO, AZUL_CLARO, VERDE_CLARO, CREME, HexColor('#EFE3F7')]


def caligrafia():
    doc = Documento('caligrafia-das-vogais.pdf', 'Caligrafia das vogais', 'Alfabeto e vogais')

    def intro(c):
        largura, passo = 86, 100
        x0 = (W - (5 * largura + 4 * (passo - largura))) / 2
        for i, (maius, minus, palavra) in enumerate(VOGAIS):
            x = x0 + i * passo
            c.setFillColor(CORES_VOGAIS[i])
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.5)
            c.roundRect(x, TOPO - 120, largura, 120, 16, fill=1)
            centro(c, maius + ' ' + minus, x + largura / 2, TOPO - 78, 42)
            centro(c, palavra, x + largura / 2, TOPO - 150, 11, NORMAL, TEXTO)
        c.setFillColor(MARROM)
        c.setFont(BOLD, 14)
        c.drawString(M, TOPO - 215, 'Vamos conversar')
        c.setFont(NORMAL, 12)
        c.setFillColor(TEXTO)
        for i, linha in enumerate([
            '• Com qual vogal começa o seu nome?',
            '• Quais palavras começam com A? E com E, I, O, U?',
            '• Diga cada vogal em voz alta e procure-as ao seu redor.',
        ]):
            c.drawString(M + 6, TOPO - 240 - i * 22, linha)
        c.setFont(BOLD, 12)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 340, 'Cubra o pontilhado com lápis:')
        fileira_tracejada(c, ['A', 'E', 'I', 'O', 'U'], TOPO - 410, 56, 70)
        fileira_tracejada(c, ['a', 'e', 'i', 'o', 'u'], TOPO - 495, 56, 70)
        c.setFont(NORMAL, 10)
        c.setFillColor(TEXTO)
        c.drawString(M, BASE + 4, 'Dica para a família: não precisa ser perfeito. Elogie o esforço e a vontade de tentar!')

    doc.pagina('As vogais',
               'Conheça as cinco vogais: A, E, I, O, U. Elas aparecem em todas as palavras!', intro)

    for i, (maius, minus, palavra) in enumerate(VOGAIS):
        def pagina_vogal(c, i=i, maius=maius, minus=minus, palavra=palavra):
            c.setFillColor(CORES_VOGAIS[i])
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.5)
            c.roundRect(M, TOPO - 120, 190, 120, 16, fill=1)
            centro(c, maius + ' ' + minus, M + 95, TOPO - 82, 62)
            # palavra de exemplo com a vogal em destaque
            x = M + 215
            c.setFont(BOLD, 34)
            c.setFillColor(ROSA)
            c.drawString(x, TOPO - 60, palavra[0])
            c.setFillColor(MARROM)
            c.drawString(x + stringWidth(palavra[0], BOLD, 34), TOPO - 60, palavra[1:])
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(x, TOPO - 84, f'Começa com a vogal {maius}.')
            y = TOPO - 175
            fileira_tracejada(c, [maius] * 6, y, 58, 84)
            fileira_tracejada(c, [minus] * 6, y - 88, 58, 84)
            fileira_tracejada(c, [maius, minus] * 3, y - 176, 58, 84)
            c.setFont(BOLD, 10)
            c.setFillColor(TEXTO)
            c.drawString(M, y - 222, 'Agora escreva sozinho:')
            pauta(c, M, y - 272, W - 2 * M, 58)
            pauta(c, M, y - 358, W - 2 * M, 58)
        doc.pagina(f'Vogal {maius} {minus}',
                   f'Cubra o pontilhado com lápis e depois escreva a vogal {maius} sozinho. Comece sempre pelo ponto de cima.',
                   pagina_vogal)

    def completar(c):
        c.setFont(BOLD, 12)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 6, 'Vogais para usar:')
        for i, (maius, _, _) in enumerate(VOGAIS):
            x = M + 130 + i * 52
            c.setFillColor(CORES_VOGAIS[i])
            c.setStrokeColor(MARROM)
            c.roundRect(x, TOPO - 22, 42, 36, 8, fill=1)
            centro(c, maius, x + 21, TOPO - 14, 22)
        palavras = [('B', 'LA'), ('C', 'SA'), ('L', 'A'), ('P', 'TO'), ('F', 'CA'), ('V', 'CA'), ('G', 'TO'), ('D', 'DO')]
        for n, (ini, fim) in enumerate(palavras):
            col, lin = n % 2, n // 2
            x = M + col * 260
            y = TOPO - 90 - lin * 120
            c.setFillColor(MARROM)
            c.setFont(BOLD, 44)
            c.drawString(x, y, ini)
            xi = x + stringWidth(ini, BOLD, 44) + 6
            c.setStrokeColor(ROSA)
            c.setLineWidth(2)
            c.setDash(4, 3)
            c.roundRect(xi, y - 8, 52, 58, 8)
            c.setDash()
            c.setFillColor(MARROM)
            c.drawString(xi + 52 + 6, y, fim)
        c.setFont(NORMAL, 10)
        c.setFillColor(TEXTO)
        c.drawString(M, BASE + 4, 'Gabarito (para a família): BOLA, CASA, LUA, PATO, FOCA, VACA, GATO, DADO.')
    doc.pagina('Qual vogal falta?',
               'Escreva no quadradinho a vogal que falta para completar cada palavra. Depois, leia a palavra em voz alta.',
               completar)

    def minhas_vogais(c):
        c.setFont(BOLD, 13)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 6, '1. Pinte cada vogal de uma cor:')
        for i, (maius, minus, _) in enumerate(VOGAIS):
            x = M + i * 100
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.5)
            c.roundRect(x, TOPO - 100, 86, 80, 14)
            texto_contorno(c, maius, x + 20, TOPO - 80, 56, tracejado=False, largura=1.6)
        c.setFont(BOLD, 13)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 140, '2. Escreva o seu nome e circule as vogais:')
        pauta(c, M, TOPO - 200, W - 2 * M, 54)
        c.setFont(BOLD, 13)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 250, '3. Escreva uma palavra para cada vogal:')
        for i, (maius, _, _) in enumerate(VOGAIS):
            y = TOPO - 305 - i * 62
            centro(c, maius, M + 20, y, 34, BOLD, ROSA)
            pauta(c, M + 50, y, W - 2 * M - 50, 34)
    doc.pagina('Minhas vogais', 'Para terminar: pinte, escreva e descubra as vogais do seu nome!', minhas_vogais)
    return doc.salvar()


#2) RECORTE E COLE: SÍLABAS (6 págs)
CONJUNTOS_SILABAS = [
    [('BOLA', ['BO', 'LA']), ('CASA', ['CA', 'SA']), ('MACACO', ['MA', 'CA', 'CO'])],
    [('PATO', ['PA', 'TO']), ('FOCA', ['FO', 'CA']), ('DADO', ['DA', 'DO'])],
    [('GATO', ['GA', 'TO']), ('LUA', ['LU', 'A']), ('UVA', ['U', 'VA'])],
]


def recorte_e_cole():
    doc = Documento('recorte-e-cole-silabas.pdf', 'Recorte e cole: sílabas', 'Sílabas e formação de palavras')
    rng = random.Random(11)
    for indice, conjunto in enumerate(CONJUNTOS_SILABAS, start=1):
        silabas = [s for _, partes in conjunto for s in partes]
        embaralhadas = silabas[:]
        rng.shuffle(embaralhadas)

        def pagina_recorte(c, embaralhadas=embaralhadas):
            lado_w, lado_h = 118, 96
            colunas = 4
            x0 = (W - (colunas * lado_w + (colunas - 1) * 10)) / 2
            for n, silaba in enumerate(embaralhadas):
                col, lin = n % colunas, n // colunas
                x = x0 + col * (lado_w + 10)
                y = TOPO - 120 - lin * (lado_h + 14)
                caixa_tracejada(c, x, y, lado_w, lado_h)
                centro(c, silaba, x + lado_w / 2, y + 28, 46)
            c.setFont(NORMAL, 10)
            c.setFillColor(TEXTO)
            c.drawString(M, BASE + 4, 'Peça a um adulto para ajudar a recortar. Guarde as sílabas para colar na próxima página.')
        doc.pagina(f'Recorte as sílabas {indice}',
                   'Recorte cada quadrado na linha pontilhada. Use tesoura sem ponta e peça ajuda a um adulto.',
                   pagina_recorte)

        def pagina_cola(c, conjunto=conjunto):
            for n, (palavra, partes) in enumerate(conjunto):
                y = TOPO - 90 - n * 190
                c.setFont(NORMAL, 11)
                c.setFillColor(TEXTO)
                c.drawString(M, y + 62, 'Modelo:')
                texto_contorno(c, palavra, M, y, 40, tracejado=False, cor=CINZA, largura=1.1, fonte=BOLD)
                x = M + 4
                y_caixa = y - 100
                for parte in partes:
                    c.setStrokeColor(ROSA)
                    c.setLineWidth(2)
                    c.setDash(5, 4)
                    c.roundRect(x, y_caixa, 108, 84, 10)
                    c.setDash()
                    x += 120
                c.setFont(NORMAL, 11)
                c.setFillColor(TEXTO)
                c.drawString(M + 400, y_caixa + 52, 'Escreva aqui:')
                linha_escrita(c, M + 400, y_caixa + 18, W - 2 * M - 400)
        doc.pagina(f'Cole e forme as palavras {indice}',
                   'Veja o modelo, escolha as sílabas certas e cole nos quadrados na ordem. Depois, escreva a palavra.',
                   pagina_cola)
    return doc.salvar()


#3) PINTE A LETRA INICIAL (12 págs)
def pinte_letra_inicial():
    doc = Documento('pinte-a-letra-inicial.pdf', 'Pinte a letra inicial', 'Alfabeto e vogais')
    for letra, palavra, com_artigo in ALFABETO:
        def pagina_letra(c, letra=letra, palavra=palavra, com_artigo=com_artigo):
            minus = letra.lower()
            tam_maius, tam_minus = 250, 160
            larg_maius = stringWidth(letra, BOLD, tam_maius)
            larg_minus = stringWidth(minus, BOLD, tam_minus)
            gap = 40
            x = (W - (larg_maius + gap + larg_minus)) / 2
            texto_contorno(c, letra, x, TOPO - 190, tam_maius, tracejado=False, largura=3.5)
            texto_contorno(c, minus, x + larg_maius + gap, TOPO - 190, tam_minus, tracejado=False, largura=3.5)
            #palavra com a inicial vazada (para pintar)
            tam = 62
            larg_total = stringWidth(palavra, BOLD, tam)
            xp = (W - larg_total) / 2
            texto_contorno(c, palavra[0], xp, TOPO - 290, tam, tracejado=False, cor=ROSA, largura=2.2)
            c.setFont(BOLD, tam)
            c.setFillColor(MARROM)
            c.drawString(xp + stringWidth(palavra[0], BOLD, tam), TOPO - 290, palavra[1:])
            #quadro para desenhar
            topo_quadro = TOPO - 325
            c.setStrokeColor(CINZA)
            c.setLineWidth(1.3)
            c.setDash(6, 4)
            c.roundRect(M, BASE + 8, W - 2 * M, topo_quadro - BASE - 8, 18)
            c.setDash()
            c.setFont(BOLD, 12)
            c.setFillColor(TEXTO)
            c.drawString(M + 16, topo_quadro - 24, f'Desenhe aqui {com_artigo}.')
        doc.pagina(f'Letra {letra}',
                   f'Pinte a letra {letra} do jeito que quiser. Depois, pinte a primeira letra da palavra {palavra} e desenhe.',
                   pagina_letra)
    return doc.salvar()


#4) CRUZADINHA DE ANIMAIS (4 págs)
#(palavra, índice da letra que cai na coluna destacada, pista)
CRUZADINHAS = [
    ('PATO', [('PEIXE', 0, 'Vive na água e nada com nadadeiras.'),
              ('ABELHA', 0, 'Voa de flor em flor e faz mel.'),
              ('TATU', 0, 'Tem um casco duro e cava buracos.'),
              ('OVELHA', 0, 'Tem lã macia.')]),
    ('SAPO', [('URSO', 2, 'Animal grande e peludo que gosta de mel.'),
              ('GATO', 1, 'Animal que faz MIAU.'),
              ('PORCO', 0, 'Animal da fazenda que adora lama.'),
              ('LOBO', 1, 'Parece um cachorro e uiva para a lua.')]),
    ('FOCA', [('GIRAFA', 4, 'Animal de pescoço bem comprido.'),
              ('GALO', 3, 'Canta de manhã: cocoricó!'),
              ('MACACO', 2, 'Gosta de banana e pula de galho em galho.'),
              ('VACA', 1, 'Dá leite e faz MUUU.')]),
]
CELULA = 38


def desenha_cruzadinha(c, linhas, y_topo, celula, mostrar_respostas, com_pistas, passo_linha):
    coluna_chave = max(idx for _, idx, _ in linhas)
    n_colunas = max(coluna_chave + len(p) - idx for p, idx, _ in linhas)
    x_grade = (W - n_colunas * celula) / 2
    for n, (palavra, idx, pista) in enumerate(linhas):
        y = y_topo - n * passo_linha
        if com_pistas:
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(x_grade, y + celula + 8, f'{n + 1}. {pista}')
        for k, letra in enumerate(palavra):
            x = x_grade + (coluna_chave - idx + k) * celula
            chave = (k == idx)
            c.setFillColor(AMARELO if chave else white)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.4)
            c.rect(x, y, celula, celula, fill=1)
            if mostrar_respostas:
                centro(c, letra, x + celula / 2, y + celula * 0.28, celula * 0.58)
    return x_grade, coluna_chave


def cruzadinhas():
    doc = Documento('cruzadinha-de-animais.pdf', 'Cruzadinha de animais', 'Atividades lúdicas')
    rng = random.Random(5)
    for n, (escondida, linhas) in enumerate(CRUZADINHAS, start=1):
        def pagina_cruz(c, escondida=escondida, linhas=linhas):
            # banco de palavras
            palavras = [p for p, _, _ in linhas]
            rng.shuffle(palavras)
            c.setFillColor(CREME)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.2)
            c.roundRect(M, TOPO - 52, W - 2 * M, 56, 14, fill=1)
            c.setFont(BOLD, 11)
            c.setFillColor(TEXTO)
            c.drawString(M + 14, TOPO - 10, 'Banco de palavras:')
            c.setFont(BOLD, 20)
            c.setFillColor(MARROM)
            c.drawCentredString(W / 2, TOPO - 38, '      '.join(palavras))
            # grade
            passo = 118
            x_grade, coluna_chave = desenha_cruzadinha(c, linhas, TOPO - 160, CELULA, False, True, passo)
            # palavra escondida
            y = TOPO - 160 - 4 * passo + 30
            c.setFont(BOLD, 13)
            c.setFillColor(MARROM)
            c.drawString(M, y + 12, 'Leia as letras da coluna amarela. Qual bicho está escondido?')
            for k in range(len(escondida)):
                c.setStrokeColor(ROSA)
                c.setLineWidth(2)
                c.rect(M + k * (CELULA + 6), y - CELULA - 14, CELULA, CELULA)
        doc.pagina(f'Cruzadinha {n}',
                   'Leia a pista, escolha o animal no banco de palavras e escreva uma letra em cada quadradinho.',
                   pagina_cruz)

    def gabarito(c):
        y = TOPO - 10
        for escondida, linhas in CRUZADINHAS:
            c.setFont(BOLD, 12)
            c.setFillColor(ROSA)
            c.drawString(M, y + 4, f'Bicho escondido: {escondida}')
            desenha_cruzadinha(c, linhas, y - 60, 24, True, False, 32)
            y -= 215
    doc.pagina('Respostas', 'Página para o adulto conferir as respostas das cruzadinhas.', gabarito)
    return doc.salvar()


#5) ALFABETO MÓVEL (3 págs)
def alfabeto_movel():
    doc = Documento('alfabeto-movel.pdf', 'Alfabeto móvel', 'Alfabeto e vogais')
    letras = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    grupos = [letras[0:9], letras[9:18], letras[18:26] + ['']]
    vogais = set('AEIOU')
    for numero, grupo in enumerate(grupos, start=1):
        def pagina_letras(c, grupo=grupo):
            lado_w, lado_h = 160, 170
            x0 = (W - (3 * lado_w + 2 * 10)) / 2
            for n, letra in enumerate(grupo):
                col, lin = n % 3, n // 3
                x = x0 + col * (lado_w + 10)
                y = TOPO + 4 - lin * (lado_h + 14) - lado_h
                if letra in vogais:
                    c.setFillColor(ROSA_CLARO)
                    c.rect(x, y, lado_w, lado_h, fill=1, stroke=0)
                caixa_tracejada(c, x, y, lado_w, lado_h)
                if letra:
                    centro(c, letra, x + lado_w / 2, y + 62, 92)
                    centro(c, letra.lower(), x + lado_w / 2, y + 16, 34, BOLD, TEXTO)
                else:
                    c.setFont(NORMAL, 10)
                    c.setFillColor(TEXTO)
                    c.drawCentredString(x + lado_w / 2, y + lado_h / 2, 'Letra em branco:')
                    c.drawCentredString(x + lado_w / 2, y + lado_h / 2 - 14, 'escreva a sua!')
        doc.pagina(f'Alfabeto móvel {numero}',
                   'Recorte as letras. As vogais têm o fundo rosado. Guarde num envelope e monte palavras!',
                   pagina_letras)
    return doc.salvar()


#6) CADERNO BA-BE-BI (22 págs)
SILABAS_B = ['BA', 'BE', 'BI', 'BO', 'BU']
EXEMPLOS_B = {'BA': ['BALA', 'BANANA'], 'BE': ['BEBÊ', 'BEIJO'], 'BI': ['BICO', 'BIGODE'], 'BO': ['BOLA', 'BOCA'], 'BU': ['BULE', 'BUZINA']}
CORES_B = [ROSA_CLARO, AZUL_CLARO, VERDE_CLARO, CREME, HexColor('#EFE3F7')]


def caderno():
    doc = Documento('caderno-ba-be-bi.pdf', 'Caderno BA-BE-BI', 'Consoantes e famílias silábicas')

    # 1 capa
    def capa(c):
        c.setFillColor(CREME)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setStrokeColor(ROSA)
        c.setLineWidth(6)
        c.roundRect(30, 30, W - 60, H - 60, 30)
        centro(c, 'CLUBINHO ABC', W / 2, H - 120, 20, BOLD, ROSA)
        for i, s in enumerate(SILABAS_B):
            x = W / 2 - 2.5 * 90 + i * 90 + 4
            c.setFillColor(CORES_B[i])
            c.setStrokeColor(MARROM)
            c.setLineWidth(2)
            c.roundRect(x, H - 330, 78, 96, 14, fill=1)
            centro(c, s, x + 39, H - 296, 36)
        centro(c, 'Caderno', W / 2, H - 440, 52)
        centro(c, 'BA - BE - BI', W / 2, H - 505, 52, BOLD, ROSA)
        centro(c, 'Traçado, colagem e leitura em voz alta', W / 2, H - 550, 15, NORMAL, TEXTO)
        c.setFont(NORMAL, 13)
        c.setFillColor(TEXTO)
        c.drawString(100, 190, 'Nome: ________________________________________')
        c.drawString(100, 150, 'Início: ___/___/_____      Fim: ___/___/_____')
    doc.pagina('', '', capa, com_cabecalho=False)

    # 2 como usar
    def como_usar(c):
        dicas = [
            'Imprima as páginas em folha A4. Lápis, giz de cera e canetinha funcionam bem.',
            'Leia a instrução de cada página em voz alta, junto com a criança.',
            'Deixe a criança tentar sozinha primeiro. Depois, ajude se for preciso.',
            'Nas páginas de recortar, use tesoura sem ponta e cola em bastão.',
            'Faça uma página por dia, em sessões curtas de 10 a 15 minutos.',
            'Comemore cada página concluída: pequenas conquistas dão vontade de continuar!',
            'Combine com o app: jogue a etapa do Clubinho ABC e depois faça uma página do caderno.',
        ]
        y = TOPO - 10
        for n, dica in enumerate(dicas, start=1):
            c.setFillColor(ROSA)
            c.circle(M + 14, y + 5, 14, fill=1, stroke=0)
            centro(c, str(n), M + 14, y, 15, BOLD, white)
            c.setFont(NORMAL, 13)
            c.setFillColor(MARROM)
            for k, linha in enumerate(simpleSplit(dica, NORMAL, 13, W - 2 * M - 50)):
                c.drawString(M + 40, y - k * 17, linha)
            y -= 66
    doc.pagina('Como usar este caderno', 'Orientações rápidas para a família.', como_usar)

    #3-7 traçado de cada sílaba
    for i, silaba in enumerate(SILABAS_B):
        def tracado(c, i=i, silaba=silaba):
            c.setFillColor(CORES_B[i])
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.5)
            c.roundRect(M, TOPO - 120, 190, 120, 16, fill=1)
            centro(c, silaba, M + 95, TOPO - 80, 64)
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(M + 215, TOPO - 36, 'Palavras com ' + silaba + ':')
            for k, p in enumerate(EXEMPLOS_B[silaba]):
                x = M + 215
                c.setFont(BOLD, 28)
                c.setFillColor(ROSA)
                c.drawString(x, TOPO - 72 - k * 38, p[:2])
                c.setFillColor(MARROM)
                c.drawString(x + stringWidth(p[:2], BOLD, 28), TOPO - 72 - k * 38, p[2:])
            y = TOPO - 180
            fileira_tracejada(c, [silaba] * 5, y, 54, 98)
            fileira_tracejada(c, [silaba.lower()] * 5, y - 85, 54, 98)
            fileira_tracejada(c, [silaba, silaba.lower()] * 2 + [silaba], y - 170, 54, 98)
            c.setFont(BOLD, 10)
            c.setFillColor(TEXTO)
            c.drawString(M, y - 215, 'Agora escreva sozinho:')
            pauta(c, M, y - 262, W - 2 * M, 54)
            pauta(c, M, y - 345, W - 2 * M, 54)
        doc.pagina(f'Traçado: {silaba}',
                   f'Cubra o pontilhado com lápis. Cada vez que escrever, diga a sílaba {silaba} em voz alta.', tracado)

    #8 leia as sílabas
    def leia_silabas(c):
        linhas = [SILABAS_B, SILABAS_B[::-1], ['BI', 'BA', 'BU', 'BE', 'BO'], ['BO', 'BU', 'BE', 'BI', 'BA']]
        for r, linha in enumerate(linhas):
            y = TOPO - 90 - r * 125
            for i, s in enumerate(linha):
                x = M + i * 100
                c.setFillColor(CORES_B[SILABAS_B.index(s)])
                c.setStrokeColor(MARROM)
                c.setLineWidth(1.4)
                c.roundRect(x, y - 30, 88, 92, 14, fill=1)
                centro(c, s, x + 44, y + 4, 38)
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(M + 515 - 40, y + 20, 'Li!')
            quadradinho(c, M + 515 - 40, y - 8, 16)
    doc.pagina('Leia as sílabas', 'Aponte com o dedo e leia cada sílaba em voz alta. Marque o quadradinho quando ler a linha.', leia_silabas)

    #9 leia as palavras
    def leia_palavras(c):
        palavras = ['BOLA', 'BALA', 'BOCA', 'BICO', 'BULE', 'BEBÊ', 'BOLO', 'BEIJO', 'BANANA', 'BUZINA']
        for n, p in enumerate(palavras):
            col, lin = n % 2, n // 2
            x = M + col * 262
            y = TOPO - 60 - lin * 105
            c.setFillColor(CREME)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.3)
            c.roundRect(x, y - 26, 248, 80, 14, fill=1)
            c.setFont(BOLD, 36)
            c.setFillColor(ROSA)
            c.drawString(x + 18, y, p[:2])
            c.setFillColor(MARROM)
            c.drawString(x + 18 + stringWidth(p[:2], BOLD, 36), y, p[2:])
            quadradinho(c, x + 220, y + 22, 16)
    doc.pagina('Leia as palavras', 'Leia cada palavra em voz alta. A sílaba em rosa é a que estamos estudando. Marque as que você leu.', leia_palavras)

    #10 leia as frases
    def leia_frases(c):
        frases = ['O bebê tem uma bola.', 'A bala é boa.', 'O bolo é bom.', 'A buzina faz bi-bi.']
        for n, frase in enumerate(frases):
            y = TOPO - 50 - n * 130
            c.setFillColor(AZUL_CLARO)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.3)
            c.roundRect(M, y - 34, W - 2 * M, 86, 16, fill=1)
            c.setFont(BOLD, 30)
            c.setFillColor(MARROM)
            c.drawString(M + 24, y, frase)
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(M + 24, y - 24, 'Li sozinho')
            quadradinho(c, M + 100, y - 28, 14)
            c.drawString(M + 140, y - 24, 'Li com ajuda')
            quadradinho(c, M + 225, y - 28, 14)
    doc.pagina('Leia as frases', 'Leia cada frase com calma. Passe o dedo embaixo das palavras enquanto lê.', leia_frases)

    #11 recorte, 12 cola
    palavras_b = [('BOLA', ['BO', 'LA']), ('BALA', ['BA', 'LA']), ('BICO', ['BI', 'CO']), ('BULE', ['BU', 'LE']), ('BEBÊ', ['BE', 'BÊ'])]
    silabas_b = ['BO', 'LA', 'BA', 'LA', 'BI', 'CO', 'BU', 'LE', 'BE', 'BÊ']
    random.Random(3).shuffle(silabas_b)

    def recorte(c):
        lado_w, lado_h = 118, 86
        x0 = (W - (4 * lado_w + 30)) / 2
        for n, s in enumerate(silabas_b):
            col, lin = n % 4, n // 4
            x = x0 + col * (lado_w + 10)
            y = TOPO - 100 - lin * (lado_h + 14)
            caixa_tracejada(c, x, y, lado_w, lado_h)
            centro(c, s, x + lado_w / 2, y + 24, 42)
    doc.pagina('Recorte as sílabas', 'Recorte cada quadrado na linha pontilhada. Peça ajuda a um adulto para usar a tesoura.', recorte)

    def cola(c):
        for n, (palavra, partes) in enumerate(palavras_b):
            y = TOPO - 40 - n * 118
            texto_contorno(c, palavra, M, y, 34, tracejado=False, cor=CINZA, largura=1.0)
            x = M + 190
            for _ in partes:
                c.setStrokeColor(ROSA)
                c.setLineWidth(2)
                c.setDash(5, 4)
                c.roundRect(x, y - 24, 96, 74, 10)
                c.setDash()
                x += 108
    doc.pagina('Cole e forme as palavras', 'Veja o modelo cinza e cole as sílabas certas, na ordem, nos quadrados.', cola)

    #13 complete a sílaba
    def complete(c):
        c.setFont(BOLD, 12)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 4, 'Sílabas para usar:')
        for i, s in enumerate(SILABAS_B):
            x = M + 130 + i * 64
            c.setFillColor(CORES_B[i])
            c.setStrokeColor(MARROM)
            c.roundRect(x, TOPO - 24, 54, 38, 8, fill=1)
            centro(c, s, x + 27, TOPO - 14, 20)
        frases = [
            ('A', 'LA rola no chão.'), ('O', 'BÊ toma leite.'), ('O', 'LE serve o chá.'), ('O passarinho tem um', 'CO.'),
            ('Eu como com a', 'CA.'), ('A', 'NANA é amarela.'), ('Eu calço a', 'TA no pé.'), ('O', 'GODE fica embaixo do nariz.'),
        ]
        for n, (ini, fim) in enumerate(frases):
            y = TOPO - 75 - n * 68
            c.setFont(BOLD, 17)
            c.setFillColor(MARROM)
            x = M
            if ini:
                c.drawString(x, y, ini)
                x += stringWidth(ini, BOLD, 17) + 8
            c.setStrokeColor(ROSA)
            c.setLineWidth(2)
            c.setDash(4, 3)
            c.roundRect(x, y - 10, 48, 34, 7)
            c.setDash()
            c.setFillColor(MARROM)
            c.drawString(x + 56, y, fim)
        c.setFont(NORMAL, 10)
        c.setFillColor(TEXTO)
        c.drawString(M, BASE + 4, 'Gabarito (para a família): BO, BE, BU, BI, BO, BA, BO, BI.')
    doc.pagina('Complete a sílaba', 'Leia a frase e escreva a sílaba que falta no quadrado. Use as sílabas do quadro.', complete)

    #14 ligue
    def ligue(c):
        esquerda = ['BO', 'BA', 'BI', 'BU', 'BE']
        direita = ['BULE', 'BEBÊ', 'BOLA', 'BICO', 'BALA']
        for n, (s, p) in enumerate(zip(esquerda, direita)):
            y = TOPO - 40 - n * 112
            c.setFillColor(CORES_B[SILABAS_B.index(s)])
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.4)
            c.roundRect(M, y - 20, 110, 76, 14, fill=1)
            centro(c, s, M + 55, y + 6, 40)
            c.setFillColor(MARROM)
            c.circle(M + 128, y + 18, 6, fill=1)
            c.setFillColor(CREME)
            c.roundRect(W - M - 230, y - 20, 230, 76, 14, fill=1)
            c.setFont(BOLD, 34)
            c.setFillColor(MARROM)
            c.drawCentredString(W - M - 115 + 12, y + 6, p)
            c.circle(W - M - 248, y + 18, 6, fill=1)
        c.setFont(NORMAL, 10)
        c.setFillColor(TEXTO)
        c.drawString(M, BASE + 4, 'Gabarito (para a família): BO-BOLA, BA-BALA, BI-BICO, BU-BULE, BE-BEBÊ.')
    doc.pagina('Ligue a sílaba à palavra', 'Ligue cada sílaba à palavra que começa com ela. Use um lápis de cor para cada linha.', ligue)

    #15-16 caça-sílabas
    def caca(alvos, cores, rng_seed, rodape_texto):
        def desenhar(c):
            rng = random.Random(rng_seed)
            colunas, linhas = 6, 7
            total = colunas * linhas
            distratores = ['CA', 'LA', 'MA', 'PA', 'TA', 'DA', 'FA', 'SA']
            celulas = []
            for alvo in alvos:
                celulas += [alvo] * 6
            celulas += [rng.choice(distratores) for _ in range(total - len(celulas))]
            rng.shuffle(celulas)
            lw, lh = 80, 62
            x0 = (W - colunas * lw) / 2
            for n, s in enumerate(celulas):
                col, lin = n % colunas, n // colunas
                x = x0 + col * lw
                y = TOPO - 50 - lin * (lh + 6)
                c.setFillColor(white)
                c.setStrokeColor(MARROM)
                c.setLineWidth(1.2)
                c.roundRect(x + 3, y - 10, lw - 6, lh - 6, 10, fill=1)
                centro(c, s, x + lw / 2, y + 12, 28)
            y_leg = TOPO - 50 - 7 * (lh + 6) - 10
            for k, (alvo, cor) in enumerate(zip(alvos, cores)):
                x = M + k * 170
                c.setFillColor(cor)
                c.setStrokeColor(MARROM)
                c.roundRect(x, y_leg - 6, 36, 26, 6, fill=1)
                c.setFillColor(MARROM)
                c.setFont(BOLD, 12)
                c.drawString(x + 44, y_leg + 2, f'= {alvo}')
            c.setFont(NORMAL, 10)
            c.setFillColor(TEXTO)
            c.drawString(M, BASE + 4, rodape_texto)
        return desenhar
    doc.pagina('Caça-sílabas 1', 'Encontre e pinte todas as sílabas BA de rosa e todas as sílabas BE de azul.',
               caca(['BA', 'BE'], [ROSA_CLARO, AZUL_CLARO], 21, 'Gabarito (para a família): há 6 sílabas BA e 6 sílabas BE.'))
    doc.pagina('Caça-sílabas 2', 'Encontre e pinte as sílabas BI de rosa, BO de azul e BU de verde.',
               caca(['BI', 'BO', 'BU'], [ROSA_CLARO, AZUL_CLARO, VERDE_CLARO], 22, 'Gabarito (para a família): há 6 sílabas BI, 6 sílabas BO e 6 sílabas BU.'))

    #17-20 escreva as palavras
    grupos = [['BOLA', 'BALA', 'BOCA', 'BICO'], ['BULE', 'BEBÊ', 'BOLO', 'BUZINA'],
              ['BIGODE', 'BARCO', 'BEIJO', 'BONECA'], ['BALEIA', 'BANANA', 'BOTA', 'BOLSA']]
    for numero, grupo in enumerate(grupos, start=1):
        def escreva(c, grupo=grupo):
            for n, palavra in enumerate(grupo):
                y = TOPO - 50 - n * 150
                c.setFont(BOLD, 11)
                c.setFillColor(ROSA)
                c.drawString(M, y + 36, f'{n + 1}.')
                c.setFont(BOLD, 40)
                c.setFillColor(MARROM)
                c.drawString(M + 24, y, palavra)
                pauta(c, M, y - 55, W - 2 * M, 38)
                texto_contorno(c, palavra, M + 24, y - 55, 38)
                pauta(c, M, y - 105, W - 2 * M, 38)
        doc.pagina(f'Escreva as palavras {numero}',
                   'Leia a palavra, cubra o pontilhado e depois escreva sozinho na linha de baixo.', escreva)

    #21 diário
    def diario(c):
        dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        colunas = ['Fiz a página', 'Li em voz alta', 'Fiquei feliz']
        x0, larg_dia, larg_col = M, 120, 130
        y = TOPO - 30
        c.setFont(BOLD, 11)
        c.setFillColor(MARROM)
        for k, nome in enumerate(colunas):
            c.drawCentredString(x0 + larg_dia + k * larg_col + larg_col / 2, y + 8, nome)
        for n, dia in enumerate(dias):
            yy = y - 20 - n * 62
            c.setFillColor(CREME if n % 2 == 0 else white)
            c.setStrokeColor(CINZA_CLARO)
            c.rect(x0, yy - 24, larg_dia + 3 * larg_col, 56, fill=1)
            c.setFont(BOLD, 13)
            c.setFillColor(MARROM)
            c.drawString(x0 + 12, yy, dia)
            for k in range(3):
                quadradinho(c, x0 + larg_dia + k * larg_col + larg_col / 2 - 11, yy - 8, 22)
        c.setFont(BOLD, 12)
        c.setFillColor(MARROM)
        c.drawString(M, TOPO - 30 - 20 - 7 * 62 - 14, 'Anotações da família:')
        linha_escrita(c, M, TOPO - 30 - 20 - 7 * 62 - 44, W - 2 * M)
    doc.pagina('Diário da semana', 'A família marca com a criança o que foi feito em cada dia.', diario)

    #22 diploma
    def diploma(c):
        c.setStrokeColor(ROSA)
        c.setLineWidth(5)
        c.roundRect(M, BASE + 40, W - 2 * M, H - 2 * BASE - 80, 24)
        c.setStrokeColor(AMARELO)
        c.setLineWidth(2)
        c.roundRect(M + 12, BASE + 52, W - 2 * M - 24, H - 2 * BASE - 104, 18)
        centro(c, 'CLUBINHO ABC', W / 2, H - 170, 20, BOLD, ROSA)
        centro(c, 'DIPLOMA', W / 2, H - 235, 58)
        centro(c, 'Parabéns,', W / 2, H - 310, 22, NORMAL, TEXTO)
        linha_escrita(c, M + 70, H - 360, W - 2 * M - 140)
        centro(c, 'você completou o', W / 2, H - 410, 20, NORMAL, TEXTO)
        centro(c, 'Caderno BA-BE-BI!', W / 2, H - 460, 34, BOLD, ROSA)
        centro(c, 'Você leu, escreveu, recortou e colou. Que orgulho!', W / 2, H - 505, 14, NORMAL, TEXTO)
        linha_escrita(c, M + 70, 200, 190)
        linha_escrita(c, W - M - 260, 200, 190)
        c.setFont(NORMAL, 10)
        c.setFillColor(TEXTO)
        c.drawCentredString(M + 165, 184, 'Assinatura do responsável')
        c.drawCentredString(W - M - 165, 184, 'Data')
    doc.pagina('', '', diploma, com_cabecalho=False)
    return doc.salvar()


if __name__ == '__main__':
    for nome, funcao in [('caligrafia-das-vogais', caligrafia), ('recorte-e-cole-silabas', recorte_e_cole),
                         ('pinte-a-letra-inicial', pinte_letra_inicial), ('cruzadinha-de-animais', cruzadinhas),
                         ('alfabeto-movel', alfabeto_movel), ('caderno-ba-be-bi', caderno)]:
        print(f'{nome}.pdf -> {funcao()} páginas')
