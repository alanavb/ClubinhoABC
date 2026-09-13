from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel

app = create_app()

with app.app_context():
    db.create_all()

    etapa1 = Etapa.query.filter_by(chave='caca-as-letras').first()
    if not etapa1:
        etapa1 = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        db.session.add(etapa1)
        db.session.commit()

        db.session.add_all([
            Atividade(etapa_id=etapa1.id, chave='ouvir', nome='Ouça e escolha', ordem=1, obrigatoria=True),
            Atividade(etapa_id=etapa1.id, chave='palavra', nome='Com qual letra começa?', ordem=2, obrigatoria=True),
            Atividade(etapa_id=etapa1.id, chave='memoria', nome='Jogo da memória', ordem=3, obrigatoria=True),
        ])
        db.session.commit()
        print('Etapa "Caça às Letras" e suas 3 atividades criadas.')
    else:
        print('Etapa "Caça às Letras" já existia, nada foi criado.')

    etapa2 = Etapa.query.filter_by(chave='monte-a-palavra').first()
    if not etapa2:
        etapa2 = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        db.session.add(etapa2)
        db.session.commit()

        db.session.add(
            Atividade(etapa_id=etapa2.id, chave='formar-palavra', nome='Forme a palavra', ordem=1, obrigatoria=True)
        )
        db.session.commit()
        print('Etapa "Monte a Palavra" criada (placeholder, para testar o RN1).')
    else:
        print('Etapa "Monte a Palavra" já existia, nada foi criado.')

    responsavel = Responsavel.query.filter_by(email='teste@clubinho.abc').first()
    if not responsavel:
        responsavel = Responsavel(nome='Responsável de Teste', email='teste@clubinho.abc')
        db.session.add(responsavel)
        db.session.commit()

        crianca = Crianca(
            responsavel_id=responsavel.id, nome='Manu', idade=6, avatar='🦊', etapa_atual_id=etapa1.id
        )
        db.session.add(crianca)
        db.session.commit()
        print(f'Responsável e criança de teste criados (crianca_id={crianca.id}, etapa_atual={etapa1.chave}).')
    else:
        crianca = responsavel.criancas[0] if responsavel.criancas else None
        print(f'Responsável de teste já existia (crianca_id={crianca.id if crianca else "?"}).')

    print('\nIDs para testar:')
    for etapa in Etapa.query.order_by(Etapa.ordem).all():
        print(f'  etapa "{etapa.chave}": etapa_id={etapa.id}')
        for atividade in Atividade.query.filter_by(etapa_id=etapa.id).order_by(Atividade.ordem).all():
            print(f'    {atividade.chave}: activity_id={atividade.id} (obrigatoria={atividade.obrigatoria})')
