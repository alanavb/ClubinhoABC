"""Três materiais que completam os eixos de conteúdo da trilha."""

import random

from reportlab.lib.colors import white
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase.pdfmetrics import stringWidth

import gerar_materiais as g
from gerar_materiais import (AMARELO, AZUL, AZUL_CLARO, BASE, BOLD, CINZA, CREME, M, MARROM, NORMAL, ROSA,
                             ROSA_CLARO, TEXTO, TOPO, VERDE_CLARO, W, Documento, caixa_tracejada, centro,
                             linha_escrita, pauta, quadradinho, texto_contorno)


def nota_adulto(c, texto):
    """Nota/gabarito para o adulto, quebrada em linhas para caber na margem."""
    c.setFont(NORMAL, 10)
    c.setFillColor(TEXTO)
    linhas = simpleSplit(texto, NORMAL, 10, W - 2 * M)
    for k, linha in enumerate(reversed(linhas)):
        c.drawString(M, BASE + 4 + k * 13, linha)


#7) RIMAS E SÍLABAS (5 págs)
#(palavra, sílabas)
PALAVRAS_CONTAR = [('BOLA', 'BO-LA'), ('SOL', 'SOL'), ('CASA', 'CA-SA'), ('MACACO', 'MA-CA-CO'),
                   ('BANANA', 'BA-NA-NA'), ('ELEFANTE', 'E-LE-FAN-TE'), ('PATO', 'PA-TO'), ('BORBOLETA', 'BOR-BO-LE-TA')]
PARES_RIMA = [('PATO', 'GATO'), ('BOLA', 'COLA'), ('PÃO', 'MÃO'), ('ASA', 'CASA'), ('FOCA', 'TOCA'), ('LUA', 'RUA')]


def rimas_silabas():
    doc = Documento('rimas-e-silabas.pdf', 'Rimas e sílabas', 'Consciência fonológica')

    def contar(c):
        for n, (palavra, partes) in enumerate(PALAVRAS_CONTAR):
            col, lin = n % 2, n // 2
            x = M + col * 262
            y = TOPO - 40 - lin * 150
            c.setFillColor(CREME)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.3)
            c.roundRect(x, y - 62, 248, 118, 14, fill=1)
            c.setFont(BOLD, 28)
            c.setFillColor(MARROM)
            c.drawString(x + 16, y + 18, palavra)
            c.setFont(NORMAL, 10)
            c.setFillColor(TEXTO)
            c.drawString(x + 16, y - 6, 'Pinte uma bolinha para cada pedaço:')
            for k in range(4):
                c.setFillColor(white)
                c.setStrokeColor(ROSA)
                c.setLineWidth(2)
                c.circle(x + 32 + k * 44, y - 38, 14, fill=1)
        resposta = ', '.join(f"{p} = {len(s.split('-'))}" for p, s in PALAVRAS_CONTAR)
        nota_adulto(c, f'Gabarito (para a família): {resposta}.')
    doc.pagina('Bata palmas e conte',
               'Diga a palavra batendo uma palma para cada pedaço (sílaba). Depois, pinte uma bolinha para cada palma.', contar)

    separar = [('BOLA', 2), ('CASA', 2), ('MACACO', 3), ('BANANA', 3), ('SAPATO', 3), ('JANELA', 3)]
    gab_separar = {'BOLA': 'BO-LA', 'CASA': 'CA-SA', 'MACACO': 'MA-CA-CO', 'BANANA': 'BA-NA-NA', 'SAPATO': 'SA-PA-TO', 'JANELA': 'JA-NE-LA'}

    def separar_silabas(c):
        for n, (palavra, qtd) in enumerate(separar):
            y = TOPO - 40 - n * 100
            c.setFont(BOLD, 34)
            c.setFillColor(MARROM)
            c.drawString(M, y, palavra)
            x = M + 230
            for _ in range(qtd):
                c.setStrokeColor(ROSA)
                c.setLineWidth(2)
                c.setDash(4, 3)
                c.roundRect(x, y - 18, 80, 58, 9)
                c.setDash()
                x += 90
        nota_adulto(c, 'Gabarito (para a família): ' + ', '.join(gab_separar.values()) + '.')
    doc.pagina('Separe as sílabas',
               'Leia cada palavra em voz alta, bata palmas e escreva um pedaço (sílaba) em cada quadradinho.', separar_silabas)

    direita = ['RUA', 'MÃO', 'TOCA', 'GATO', 'CASA', 'COLA']

    def ligar_rimas(c):
        c.setFont(NORMAL, 11)
        c.setFillColor(TEXTO)
        c.drawString(M, TOPO - 6, 'Rimar é terminar com o mesmo som, como em PATO e GATO.')
        for n, (esq, _) in enumerate(PARES_RIMA):
            y = TOPO - 70 - n * 90
            c.setFillColor(AZUL_CLARO)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.3)
            c.roundRect(M, y - 22, 150, 62, 12, fill=1)
            centro(c, esq, M + 75, y - 2, 28)
            c.setFillColor(MARROM)
            c.circle(M + 170, y + 9, 6, fill=1)
            c.setFillColor(CREME)
            c.setStrokeColor(MARROM)
            c.roundRect(W - M - 150, y - 22, 150, 62, 12, fill=1)
            centro(c, direita[n], W - M - 75, y - 2, 28)
            c.setFillColor(MARROM)
            c.circle(W - M - 170, y + 9, 6, fill=1)
        nota_adulto(c, 'Gabarito (para a família): ' + ', '.join(f'{a}-{b}' for a, b in PARES_RIMA) + '.')
    doc.pagina('Ligue as rimas',
               'Ligue cada palavra da esquerda à palavra da direita que termina com o mesmo som.', ligar_rimas)

    qual = [('PATO', ['GATO', 'SOL', 'BOLA'], 'GATO'), ('LUA', ['RUA', 'CASA', 'PÃO'], 'RUA'),
            ('MÃO', ['PÃO', 'FOCA', 'UVA'], 'PÃO'), ('COLA', ['BOLA', 'DADO', 'SAPO'], 'BOLA'),
            ('CASA', ['ASA', 'BOLA', 'FOCA'], 'ASA'), ('TOCA', ['FOCA', 'GATO', 'LUA'], 'FOCA')]

    def qual_rima(c):
        for n, (palavra, opcoes, _) in enumerate(qual):
            y = TOPO - 30 - n * 82
            c.setFont(BOLD, 18)
            c.setFillColor(MARROM)
            c.drawString(M, y, f'{n + 1}. Qual palavra rima com')
            c.setFillColor(ROSA)
            c.drawString(M + 250, y, palavra + '?')
            for k, op in enumerate(opcoes):
                x = M + 20 + k * 165
                quadradinho(c, x, y - 36, 16)
                c.setFont(BOLD, 16)
                c.setFillColor(MARROM)
                c.drawString(x + 26, y - 33, op)
        nota_adulto(c, 'Gabarito (para a família): ' + ', '.join(f'{i + 1}-{r}' for i, (_, _, r) in enumerate(qual)) + '.')
    doc.pagina('Qual palavra rima?', 'Leia a palavra e marque a opção que termina com o mesmo som.', qual_rima)

    quadro = [('BOLA', 'BO', 'LA'), ('CASA', 'CA', 'SA'), ('PATO', 'PA', 'TO'), ('MACACO', 'MA', 'CO'),
              ('UVA', 'U', 'VA'), ('SAPATO', 'SA', 'TO')]

    def inicial_final(c):
        x0 = [M, M + 190, M + 355]
        c.setFont(BOLD, 12)
        c.setFillColor(ROSA)
        for x, rotulo in zip(x0, ['Palavra', 'Primeira sílaba', 'Última sílaba']):
            c.drawString(x + 6, TOPO - 6, rotulo)
        for n, (palavra, ini, fim) in enumerate(quadro):
            y = TOPO - 90 - n * 90
            c.setFont(BOLD, 28)
            c.setFillColor(MARROM)
            c.drawString(x0[0] + 6, y, palavra)
            for x, texto in ((x0[1], ini), (x0[2], fim)):
                c.setStrokeColor(ROSA)
                c.setLineWidth(2)
                if n == 0:  # a primeira linha já vem preenchida, como exemplo
                    c.setFillColor(ROSA_CLARO)
                    c.roundRect(x, y - 16, 130, 56, 10, fill=1)
                    centro(c, texto, x + 65, y, 28)
                else:
                    c.setDash(4, 3)
                    c.roundRect(x, y - 16, 130, 56, 10)
                    c.setDash()
        nota_adulto(c, 'A primeira linha é um exemplo. Gabarito: ' + ', '.join(f'{p} = {a}/{b}' for p, a, b in quadro[1:]) + '.')
    doc.pagina('Começo e fim da palavra',
               'Escreva a primeira e a última sílaba de cada palavra. A primeira linha já está pronta como exemplo.', inicial_final)
    return doc.salvar()


#8) MONTE A FRASE (5 págs)
FRASES_RECORTE = [['O', 'gato', 'dorme', 'no', 'sofá.'], ['A', 'menina', 'come', 'uma', 'maçã.'],
                  ['O', 'pato', 'nada', 'no', 'lago.'], ['Eu', 'gosto', 'de', 'ler.']]
FRASES_ORDENAR = [(['bola', 'A', 'é', 'redonda.'], 'A bola é redonda.'),
                  (['come', 'O', 'banana', 'macaco', 'uma.'], 'O macaco come uma banana.'),
                  (['flor', 'Ana', 'uma', 'viu.'], 'Ana viu uma flor.'),
                  (['chove', 'Hoje', 'muito.'], 'Hoje chove muito.')]
COMPLETAR = [('O', 'nada no lago.', 'pato'), ('O', 'brilha de dia.', 'sol'), ('A', 'aparece à noite.', 'lua'),
             ('O', 'pega o rato.', 'gato'), ('A', 'rola no chão.', 'bola'), ('A', 'nasce no jardim.', 'flor')]
DITADO = ['A bola é azul.', 'O gato come peixe.', 'Eu vi a lua.', 'Mamãe fez um bolo.']


def monte_a_frase():
    doc = Documento('monte-a-frase.pdf', 'Monte a frase', 'Formação de frases e escrita')
    palavras = [p for frase in FRASES_RECORTE for p in frase]
    random.Random(8).shuffle(palavras)

    def recorte(c):
        colunas, lw, lh = 4, 118, 66
        x0 = (W - (colunas * lw + (colunas - 1) * 10)) / 2
        for n, palavra in enumerate(palavras):
            col, lin = n % colunas, n // colunas
            x = x0 + col * (lw + 10)
            y = TOPO - 80 - lin * (lh + 12)
            caixa_tracejada(c, x, y, lw, lh)
            centro(c, palavra, x + lw / 2, y + 24, 24)
        nota_adulto(c, 'As palavras de cada frase estão misturadas. Guarde-as para colar na próxima página.')
    doc.pagina('Recorte as palavras',
               'Recorte cada quadradinho na linha pontilhada. Use tesoura sem ponta e peça ajuda a um adulto.', recorte)

    def cola(c):
        for n, frase in enumerate(FRASES_RECORTE):
            y = TOPO - 40 - n * 150
            c.setFont(NORMAL, 11)
            c.setFillColor(TEXTO)
            c.drawString(M, y + 14, 'Modelo:')
            texto_contorno(c, ' '.join(frase), M + 60, y + 12, 26, tracejado=False, cor=CINZA, largura=1.0)
            c.setStrokeColor(ROSA)
            c.setLineWidth(2)
            c.setDash(5, 4)
            c.roundRect(M, y - 78, W - 2 * M, 80, 12)
            c.setDash()
    doc.pagina('Cole e forme as frases',
               'Veja o modelo cinza e cole as palavras na ordem certa, dentro do retângulo. Não esqueça do ponto final!', cola)

    def ordenar(c):
        for n, (mistas, _) in enumerate(FRASES_ORDENAR):
            y = TOPO - 30 - n * 150
            c.setFont(BOLD, 13)
            c.setFillColor(ROSA)
            c.drawString(M, y + 2, f'{n + 1}.')
            x = M + 28
            for palavra in mistas:
                larg = max(54, stringWidth(palavra, BOLD, 18) + 26)
                c.setFillColor(AZUL_CLARO)
                c.setStrokeColor(MARROM)
                c.setLineWidth(1.2)
                c.roundRect(x, y - 12, larg, 36, 9, fill=1)
                centro(c, palavra, x + larg / 2, y - 1, 18)
                x += larg + 10
            pauta(c, M, y - 62, W - 2 * M, 36)
        nota_adulto(c, 'Gabarito (para a família): ' + ' | '.join(f for _, f in FRASES_ORDENAR))
    doc.pagina('Ponha as palavras em ordem',
               'As palavras estão embaralhadas. Escreva a frase certa na linha. Comece com letra maiúscula e termine com ponto.', ordenar)

    banco = ['pato', 'sol', 'lua', 'gato', 'bola', 'flor']
    random.Random(2).shuffle(banco)

    def completar(c):
        c.setFillColor(CREME)
        c.setStrokeColor(MARROM)
        c.setLineWidth(1.2)
        c.roundRect(M, TOPO - 40, W - 2 * M, 50, 14, fill=1)
        c.setFont(BOLD, 11)
        c.setFillColor(TEXTO)
        c.drawString(M + 14, TOPO - 4, 'Banco de palavras:')
        c.setFont(BOLD, 20)
        c.setFillColor(MARROM)
        c.drawCentredString(W / 2, TOPO - 30, '      '.join(banco))
        for n, (artigo, resto, _) in enumerate(COMPLETAR):
            y = TOPO - 100 - n * 78
            c.setFont(BOLD, 22)
            c.setFillColor(MARROM)
            c.drawString(M, y, artigo)
            xi = M + 14 + c.stringWidth(artigo, BOLD, 22)
            c.setStrokeColor(ROSA)
            c.setLineWidth(2)
            c.setDash(4, 3)
            c.roundRect(xi, y - 10, 110, 38, 8)
            c.setDash()
            c.setFillColor(MARROM)
            c.drawString(xi + 122, y, resto)
        nota_adulto(c, 'Gabarito (para a família): ' + ', '.join(r for _, _, r in COMPLETAR) + '.')
    doc.pagina('Complete a frase', 'Leia a frase e escolha a palavra do banco que faz sentido para completar.', completar)

    def ditado(c):
        for n in range(4):
            y = TOPO - 40 - n * 90
            c.setFont(BOLD, 13)
            c.setFillColor(ROSA)
            c.drawString(M, y + 4, f'{n + 1}.')
            pauta(c, M + 24, y, W - 2 * M - 24, 36)
        c.setFillColor(CREME)
        c.setStrokeColor(MARROM)
        c.setLineWidth(1.2)
        c.roundRect(M, BASE + 18, W - 2 * M, 100, 14, fill=1)
        c.setFont(BOLD, 11)
        c.setFillColor(ROSA)
        c.drawString(M + 14, BASE + 100, 'Para o adulto: frases do ditado (leia devagar, uma de cada vez)')
        c.setFont(NORMAL, 13)
        c.setFillColor(MARROM)
        for n, frase in enumerate(DITADO):
            c.drawString(M + 24, BASE + 78 - n * 20, f'{n + 1}. {frase}')
    doc.pagina('Ditado de frases',
               'Um adulto lê cada frase em voz alta, devagar. Escreva o que ouviu na linha. Lembre da letra maiúscula e do ponto.', ditado)
    return doc.salvar()


#9) LEIA E RESPONDA (5 págs)
TEXTOS = [
    ('A joaninha Lia',
     'Lia é uma joaninha vermelha. Ela mora em uma flor amarela. De manhã, Lia voa até a horta para ver as folhas verdes.',
     [('Qual é a cor de Lia?', ['vermelha', 'azul', 'preta'], 0),
      ('Onde Lia mora?', ['em uma flor amarela', 'em uma folha verde', 'em uma casa'], 0),
      ('Para onde Lia voa de manhã?', ['para a horta', 'para o rio', 'para a escola'], 0)],
     'De que cor são as folhas?', 'verdes'),
    ('A festa de Bia',
     'Hoje é aniversário de Bia. A vovó fez um bolo de cenoura. Os amigos cantaram parabéns e Bia soprou as velinhas.',
     [('Quem faz aniversário?', ['a vovó', 'Bia', 'os amigos'], 1),
      ('De que é o bolo?', ['de chocolate', 'de morango', 'de cenoura'], 2),
      ('O que Bia soprou?', ['as velinhas', 'o balão', 'a sopa'], 0)],
     'Quem fez o bolo?', 'a vovó'),
    ('O dia de chuva',
     'Choveu o dia todo. Leo ficou em casa. Ele leu um livro, pintou um desenho e fez um barco de papel.',
     [('O que aconteceu o dia todo?', ['fez sol', 'choveu', 'nevou'], 1),
      ('O que Leo fez com o papel?', ['um avião', 'um chapéu', 'um barco'], 2),
      ('Quantas coisas Leo fez em casa?', ['2', '3', '4'], 1)],
     'O que Leo leu?', 'um livro'),
    ('Receita: suco de laranja',
     'Você vai precisar de 2 laranjas, 1 copo e gelo. 1. Esprema as laranjas. 2. Coloque o suco no copo. 3. Acrescente o gelo. Pronto!',
     [('Quantas laranjas a receita usa?', ['1', '2', '3'], 1),
      ('O que se faz primeiro?', ['acrescentar o gelo', 'espremer as laranjas', 'colocar no copo'], 1),
      ('O que se coloca por último?', ['as laranjas', 'o copo', 'o gelo'], 2)],
     'Onde se coloca o suco?', 'no copo'),
]
VERDADEIRO_FALSO = [('Lia é uma joaninha azul.', False), ('Lia mora em uma flor amarela.', True),
                    ('O bolo de Bia é de chocolate.', False), ('Os amigos cantaram parabéns.', True),
                    ('Leo ficou em casa porque choveu.', True), ('Leo jogou futebol.', False)]


def leia_responda():
    doc = Documento('leia-e-responda.pdf', 'Leia e responda', 'Leitura e interpretação de textos curtos')
    for numero, (titulo, texto, perguntas, escreva, resposta_escrita) in enumerate(TEXTOS, start=1):
        def pagina_texto(c, titulo=titulo, texto=texto, perguntas=perguntas, escreva=escreva, resposta_escrita=resposta_escrita):
            linhas = simpleSplit(texto, BOLD, 21, W - 2 * M - 40)
            altura = 52 + len(linhas) * 30
            c.setFillColor(CREME)
            c.setStrokeColor(MARROM)
            c.setLineWidth(1.4)
            c.roundRect(M, TOPO - altura + 10, W - 2 * M, altura, 16, fill=1)
            c.setFont(BOLD, 12)
            c.setFillColor(ROSA)
            c.drawString(M + 20, TOPO - 14, titulo.upper())
            c.setFont(BOLD, 21)
            c.setFillColor(MARROM)
            for k, linha in enumerate(linhas):
                c.drawString(M + 20, TOPO - 48 - k * 30, linha)
            y = TOPO - altura - 30
            for n, (pergunta, opcoes, _) in enumerate(perguntas, start=1):
                c.setFont(BOLD, 15)
                c.setFillColor(MARROM)
                c.drawString(M, y, f'{n}. {pergunta}')
                for k, op in enumerate(opcoes):
                    yy = y - 24 - k * 24
                    quadradinho(c, M + 20, yy - 3, 15)
                    c.setFont(NORMAL, 14)
                    c.drawString(M + 46, yy, op)
                y -= 24 + len(opcoes) * 24 + 22
            c.setFont(BOLD, 15)
            c.setFillColor(MARROM)
            c.drawString(M, y, f'4. {escreva}')
            linha_escrita(c, M + 20, y - 30, W - 2 * M - 20)
            gab = '; '.join(f"{n}-{perguntas[n - 1][1][perguntas[n - 1][2]]}" for n in range(1, 4))
            nota_adulto(c, f'Gabarito (para a família): {gab}; 4-{resposta_escrita}.')
        doc.pagina(f'Texto {numero}: {titulo}', 'Leia o texto com calma, duas vezes se precisar. Depois, marque a resposta certa.', pagina_texto)

    def verdadeiro_falso(c):
        c.setFont(BOLD, 12)
        c.setFillColor(ROSA)
        c.drawString(W - M - 120, TOPO - 6, 'V')
        c.drawString(W - M - 60, TOPO - 6, 'F')
        for n, (frase, _) in enumerate(VERDADEIRO_FALSO):
            y = TOPO - 50 - n * 84
            c.setFillColor(AZUL_CLARO if n % 2 == 0 else white)
            c.setStrokeColor(CINZA)
            c.setLineWidth(1)
            c.roundRect(M, y - 24, W - 2 * M, 62, 12, fill=1)
            c.setFont(BOLD, 17)
            c.setFillColor(MARROM)
            c.drawString(M + 14, y + 4, frase)
            quadradinho(c, W - M - 126, y - 6, 22)
            quadradinho(c, W - M - 66, y - 6, 22)
        gab = ', '.join(f"{n + 1}-{'V' if v else 'F'}" for n, (_, v) in enumerate(VERDADEIRO_FALSO))
        nota_adulto(c, f'Gabarito (para a família): {gab}.')
    doc.pagina('Verdadeiro ou falso?',
               'Pense nos textos que você leu. Marque V se a frase for verdadeira ou F se for falsa.', verdadeiro_falso)
    return doc.salvar()

if __name__ == '__main__':
    import gerar_materiais as base
    for nome, funcao in [('caligrafia-das-vogais', base.caligrafia), ('pinte-a-letra-inicial', base.pinte_letra_inicial),
                         ('alfabeto-movel', base.alfabeto_movel), ('caderno-ba-be-bi', base.caderno),
                         ('recorte-e-cole-silabas', base.recorte_e_cole), ('rimas-e-silabas', rimas_silabas),
                         ('monte-a-frase', monte_a_frase), ('leia-e-responda', leia_responda),
                         ('cruzadinha-de-animais', base.cruzadinhas)]:
        print(f'{nome}.pdf -> {funcao()} páginas')
