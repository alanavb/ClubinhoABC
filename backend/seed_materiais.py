#Importa o catálogo inicial de materiais sem duplicar os já cadastrados.

from app import create_app, db
from app.models import Material, ReferenciaMaterial


MATERIAIS_INICIAIS = [
    {'chave': 'caderno-ba-be-bi', 'titulo': 'Caderno BA-BE-BI completo', 'eixo': 'Consoantes e famílias silábicas', 'descricao': 'Páginas com traçado, colagem e leitura em voz alta, no ritmo da trilha de', 'arquivo': '/materiais/caderno-ba-be-bi.pdf', 'paginas': 22, 'icone': '✏️', 'tom': 'orange', 'categoria': 'Para Imprimir', 'destaque': True},
    {'chave': 'caligrafia-vogais', 'titulo': 'Caligrafia das vogais', 'eixo': 'Alfabeto e vogais', 'arquivo': '/materiais/caligrafia-das-vogais.pdf', 'paginas': 8, 'icone': '▤', 'tom': 'orange', 'categoria': 'Para Imprimir', 'destaque': False},
    {'chave': 'pinte-letra-inicial', 'titulo': 'Pinte a letra inicial', 'eixo': 'Alfabeto e vogais', 'arquivo': '/materiais/pinte-a-letra-inicial.pdf', 'paginas': 12, 'icone': '🎨', 'tom': 'yellow', 'categoria': 'Colorir', 'destaque': False},
    {'chave': 'alfabeto-movel', 'titulo': 'Alfabeto móvel', 'eixo': 'Alfabeto e vogais', 'arquivo': '/materiais/alfabeto-movel.pdf', 'paginas': 3, 'icone': '✂', 'tom': 'orange', 'categoria': 'Recortar', 'destaque': False},
    {'chave': 'recorte-silabas', 'titulo': 'Recorte e cole: sílabas', 'eixo': 'Sílabas e formação de palavras', 'arquivo': '/materiais/recorte-e-cole-silabas.pdf', 'paginas': 6, 'icone': '✂', 'tom': 'blue', 'categoria': 'Recortar', 'destaque': False},
    {'chave': 'rimas-silabas', 'titulo': 'Rimas e sílabas', 'eixo': 'Consciência fonológica', 'arquivo': '/materiais/rimas-e-silabas.pdf', 'paginas': 5, 'icone': '▤', 'tom': 'yellow', 'categoria': 'Para Imprimir', 'destaque': False},
    {'chave': 'monte-frase', 'titulo': 'Monte a frase', 'eixo': 'Formação de frases e escrita', 'arquivo': '/materiais/monte-a-frase.pdf', 'paginas': 5, 'icone': '✂', 'tom': 'orange', 'categoria': 'Recortar', 'destaque': False},
    {'chave': 'leia-responda', 'titulo': 'Leia e responda', 'eixo': 'Leitura e interpretação de textos curtos', 'arquivo': '/materiais/leia-e-responda.pdf', 'paginas': 5, 'icone': '▤', 'tom': 'blue', 'categoria': 'Para Imprimir', 'destaque': False},
    {'chave': 'cruzadinha-animais', 'titulo': 'Cruzadinha de animais', 'eixo': 'Atividades lúdicas', 'arquivo': '/materiais/cruzadinha-de-animais.pdf', 'paginas': 4, 'icone': '▤', 'tom': 'blue', 'categoria': 'Para Imprimir', 'destaque': False},
]

REFERENCIA_INICIAL = {
    'chave': 'guia-atividades-alfabetizacao',
    'titulo': 'Atividades de alfabetização para imprimir em PDF',
    'veiculo': 'Via Carreira',
    'url': 'https://viacarreira.com/atividades-de-alfabetizacao-para-imprimir-em-pdf/',
}


def popular_materiais():
    #Cria somente os materiais e a referência que ainda não existirem pela chave.
    criados = 0
    for ordem, dados in enumerate(MATERIAIS_INICIAIS, start=1):
        if Material.query.filter_by(chave=dados['chave']).first():
            continue
        db.session.add(Material(**dados, ordem=ordem, publicado=True))
        criados += 1

    if not ReferenciaMaterial.query.filter_by(chave=REFERENCIA_INICIAL['chave']).first():
        db.session.add(ReferenciaMaterial(**REFERENCIA_INICIAL, ativa=True))

    db.session.commit()
    return criados


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        criados = popular_materiais()
        print(f'{criados} material(is) criado(s).')
