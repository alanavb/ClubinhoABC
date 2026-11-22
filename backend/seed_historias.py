"""Importa as histórias iniciais sem duplicar conteúdos já cadastrados."""

from app import create_app, db
from app.models import Historia


METODOLOGIAS = {
    'iniciante': 'Palavras e frases curtas, com repetição de sílabas simples para apoiar a decodificação.',
    'intermediario': 'Frases conectadas e vocabulário do cotidiano para desenvolver ritmo e fluência de leitura.',
    'avancado': 'Histórias curtas com início, acontecimento e desfecho para apoiar a compreensão do texto.',
    'rimas': 'Parlendas e histórias em versos para estimular a oralidade, o ritmo e a percepção de rimas.',
}


HISTORIAS_INICIAIS = [
    {'chave': 'baleia-bela', 'icone': '🐳', 'titulo': 'A Baleia e a Bola', 'nivel': 'Nível 1', 'nivel_classe': 'iniciante', 'objetivo': 'Reconhecer e acompanhar sílabas simples com BA, BE, BI e BO.', 'tag': 'BA · BE · BI · BO', 'tempo': '2 min', 'tema': 'oceano', 'texto': 'Bela é uma baleia azul. Ela nada no mar bem calmo. Bela vê uma bola boiando. A baleia bate na bola: ploc, ploc! Depois, Bela dá tchau para a bola e volta feliz para casa.'},
    {'chave': 'gato-guto', 'icone': '🐱', 'titulo': 'O Gato Guto', 'nivel': 'Nível 1', 'nivel_classe': 'iniciante', 'objetivo': 'Reconhecer e acompanhar sílabas simples com GA, GO e GU.', 'tag': 'GA · GO · GU', 'tempo': '2 min', 'tema': 'noite', 'texto': 'Guto é um gato. O gato viu uma gota de leite no prato. Guto lambeu a gota. Depois, o gato dormiu no tapete.'},
    {'chave': 'bia-borboleta', 'icone': '🦋', 'titulo': 'Bia e a Borboleta', 'nivel': 'Nível 2', 'nivel_classe': 'intermediario', 'objetivo': 'Ler frases curtas conectadas, observando a repetição de BI, BO e BR.', 'tag': 'BI · BO · BR', 'tempo': '2 min', 'tema': 'jardim', 'texto': 'Bia viu uma borboleta na flor. A borboleta bateu as asas e voou. Bia ficou bem feliz. Ela viu a borboleta pousar em uma folha.'},
    {'chave': 'casa-lia', 'icone': '🏠', 'titulo': 'A Casa de Lia', 'nivel': 'Nível 2', 'nivel_classe': 'intermediario', 'objetivo': 'Ler frases curtas com palavras do cotidiano e sílabas LA, SA e MA.', 'tag': 'LA · SA · MA', 'tempo': '2 min', 'tema': 'casa', 'texto': 'Lia mora em uma casa amarela. Na sala, ela viu uma mala e uma bola. Lia chamou sua avó para brincar.'},
    {'chave': 'piquenique-caio', 'icone': '🧺', 'titulo': 'Piquenique com Caio', 'nivel': 'Nível 3', 'nivel_classe': 'avancado', 'objetivo': 'Acompanhar uma narrativa curta com começo, acontecimento e final.', 'tag': 'CA · CO · PI', 'tempo': '3 min', 'tema': 'parque', 'texto': 'Caio levou uma cesta com bolo, banana e suco. No parque, ele viu uma borboleta perto das flores. Caio dividiu o lanche com Bia. Depois, os dois correram e brincaram na grama.'},
    {'chave': 'passeio-nino', 'icone': '🛴', 'titulo': 'O Passeio de Nino', 'nivel': 'Nível 3', 'nivel_classe': 'avancado', 'objetivo': 'Acompanhar uma narrativa curta com mais personagens e ações.', 'tag': 'NI · PA · CA', 'tempo': '3 min', 'tema': 'ceu', 'texto': 'Nino levou seu patinete para o parque. No caminho, ele encontrou uma amiga e seu cachorro. Os dois pararam perto de uma árvore para beber água. Depois, Nino voltou para casa muito contente.'},
    {'chave': 'parlendas-brincar', 'icone': '🎵', 'titulo': 'Parlendas para Brincar', 'nivel': 'Nível 4', 'nivel_classe': 'rimas', 'objetivo': 'Conhecer parlendas da tradição oral, percebendo ritmo, repetição e rimas.', 'tag': '3 PARLENDAS', 'tempo': '3 min', 'tema': 'parlenda', 'texto': 'Um, dois, feijão com arroz. Três, quatro, feijão no prato. Cinco, seis, falar inglês. Sete, oito, comer biscoito. Nove, dez, comer pastéis. Uni, duni, tê. Salamê, mingüê. Um sorvete colorê. O escolhido foi você! Batatinha quando nasce se esparrama pelo chão. Menininha quando dorme põe a mão no coração.'},
    {'chave': 'parlendas-roda', 'icone': '🪇', 'titulo': 'Parlendas de Roda', 'nivel': 'Nível 4', 'nivel_classe': 'rimas', 'objetivo': 'Conhecer parlendas da tradição oral, percebendo ritmo, repetição e rimas.', 'tag': '3 PARLENDAS', 'tempo': '3 min', 'tema': 'parlenda', 'texto': 'Hoje é domingo, pede cachimbo. O cachimbo é de ouro, bate no touro. O touro é valente, bate na gente. A gente é fraco, cai no buraco. O buraco é fundo, acabou-se o mundo. Corre, cutia, na casa da tia. Corre, cipó, na casa da avó. Lencinho na mão caiu no chão. Moça bonita do meu coração. O macaco foi à feira, não teve o que comprar. Comprou uma cadeira pra comadre se sentar.'},
    {'chave': 'lila-e-lua', 'icone': '🌙', 'titulo': 'Lila e a Lua', 'nivel': 'Nível 4', 'nivel_classe': 'rimas', 'objetivo': 'Acompanhar uma história curta em versos, percebendo palavras com sons parecidos.', 'tag': 'HISTÓRIA RIMADA', 'tempo': '2 min', 'tema': 'parlenda', 'texto': 'Lila viu a lua lá no céu. Pegou sua lanterna e fez um papel. Dobrou uma estrela, pintou de azul. E deixou o desenho perto do baú. A lua brilhou, Lila sorriu. Boa noite, lua! E assim dormiu.'},
    {'chave': 'gato-rato', 'icone': '🐱', 'titulo': 'O Gato e o Rato', 'nivel': 'Nível 4', 'nivel_classe': 'rimas', 'objetivo': 'Acompanhar uma história curta em versos, percebendo palavras com sons parecidos.', 'tag': 'HISTÓRIA RIMADA', 'tempo': '2 min', 'tema': 'parlenda', 'texto': 'Guto, o gato, viu Tito, o rato. Tito usava um pequeno sapato. Os dois foram ao quintal brincar. Depois sentaram para conversar. Quando a lua começou a brilhar, voltaram felizes para descansar.'},
]


def popular_historias():
    """Cria somente as histórias que ainda não existirem pela chave."""
    criadas = 0
    for ordem, dados in enumerate(HISTORIAS_INICIAIS, start=1):
        if Historia.query.filter_by(chave=dados['chave']).first():
            continue
        db.session.add(Historia(
            **dados,
            metodologia=METODOLOGIAS[dados['nivel_classe']],
            ordem=ordem,
            publicada=True,
        ))
        criadas += 1
    db.session.commit()
    return criadas


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        criadas = popular_historias()
        print(f'{criadas} história(s) criada(s).')
