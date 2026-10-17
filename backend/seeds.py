from app import create_app, db
from app.models import Atividade, Etapa
from migrar_data_nascimento import migrar

app = create_app()


def garantir_atividades(etapa, atividades):
    """Cria apenas as atividades que ainda não existem, sem alterar dados já cadastrados."""
    criadas = []
    for chave, nome, ordem, obrigatoria in atividades:
        atividade = Atividade.query.filter_by(chave=chave).first()
        if atividade:
            print(f'Atividade "{atividade.nome}" já existia, nada foi alterado.')
            continue

        db.session.add(Atividade(
            etapa_id=etapa.id,
            chave=chave,
            nome=nome,
            ordem=ordem,
            obrigatoria=obrigatoria,
        ))
        criadas.append(nome)

    if criadas:
        db.session.commit()
        print(f'Atividades criadas na etapa "{etapa.nome}": {", ".join(criadas)}.')


with app.app_context():
    db.create_all()
    migrar()  # create_all só cria tabelas novas; colunas novas em tabelas existentes vêm daqui

    etapa1 = Etapa.query.filter_by(chave='caca-as-letras').first()
    if not etapa1:
        etapa1 = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        db.session.add(etapa1)
        db.session.commit()
        print('Etapa "Caça às Letras" criada.')
    else:
        print('Etapa "Caça às Letras" já existia, nada foi criado.')

    garantir_atividades(etapa1, [
        ('ouvir', 'Qual é a letra?', 1, True),
        ('palavra', 'Com qual letra começa?', 2, True),
        ('memoria', 'Jogo da memória', 3, True),
        ('bonus', 'Desafio bônus', 4, False),
    ])

    etapa2 = Etapa.query.filter_by(chave='monte-a-palavra').first()
    if not etapa2:
        etapa2 = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        db.session.add(etapa2)
        db.session.commit()
        print('Etapa "Monte a Palavra" criada (placeholder, para testar o RN1).')
    else:
        print('Etapa "Monte a Palavra" já existia, nada foi criado.')

    garantir_atividades(etapa2, [
        ('formar-palavra', 'Forme a palavra', 1, True),
    ])

    etapa3 = Etapa.query.filter_by(chave='ouca-e-escolha').first()
    if not etapa3:
        etapa3 = Etapa(chave='ouca-e-escolha', nome='Ouça e Escolha', ordem=3)
        db.session.add(etapa3)
        db.session.commit()
        print('Etapa "Ouça e Escolha" criada.')
    else:
        print('Etapa "Ouça e Escolha" já existia, nada foi criado.')

    garantir_atividades(etapa3, [
        ('frase-cena', 'Rádio das Histórias', 1, True),
        ('complete-frase', 'Balões de Palavras', 2, True),
        ('frases-sonoras', 'Frases Sonoras', 3, True),
        ('bonus-ouca', 'Detetive de Histórias', 4, False),
    ])

    # Responsável e criança não são mais fabricados aqui: a conta agora nasce
    # no Supabase Auth (cadastro real, com confirmação por e-mail) e o perfil
    # local (responsável + criança) é criado automaticamente pelo back-end
    # assim que a pessoa confirma o e-mail e entra pela primeira vez.
    print('\nPara testar de ponta a ponta, crie uma conta pela tela de cadastro do front-end.')

    print('\nIDs para testar:')
    for etapa in Etapa.query.order_by(Etapa.ordem).all():
        print(f'  etapa "{etapa.chave}": etapa_id={etapa.id}')
        for atividade in Atividade.query.filter_by(etapa_id=etapa.id).order_by(Atividade.ordem).all():
            print(f'    {atividade.chave}: activity_id={atividade.id} (obrigatoria={atividade.obrigatoria})')
