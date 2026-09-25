from app import create_app, db
from app.models import Atividade, Etapa

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

    bonus = Atividade.query.filter_by(chave='bonus').first() #Atividade bônus para testar o RN3
    if not bonus:
        bonus = Atividade(etapa_id=etapa1.id, chave='bonus', nome='Desafio bônus', ordem=4, obrigatoria=False)
        db.session.add(bonus)
        db.session.commit()
        print('Atividade "Desafio bônus" (opcional) criada na etapa "Caça às Letras".')
    else:
        print('Atividade "Desafio bônus" já existia, nada foi criado.')

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
