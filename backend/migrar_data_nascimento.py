"""Migração: criancas.idade -> criancas.data_nascimento.

Só acrescenta: cria a coluna data_nascimento e tira a obrigatoriedade de idade
(o código novo não grava mais idade). Nenhum dado é apagado. Pode rodar mais de uma vez.
Crianças já cadastradas ficam sem data até o responsável informar.
"""

from sqlalchemy import inspect, text

from app import create_app, db

app = create_app()

with app.app_context():
    colunas = {coluna['name'] for coluna in inspect(db.engine).get_columns('criancas')}

    if 'data_nascimento' not in colunas:
        db.session.execute(text('ALTER TABLE criancas ADD COLUMN data_nascimento DATE'))
        print('Coluna data_nascimento criada.')
    else:
        print('Coluna data_nascimento já existia.')

    if 'idade' in colunas:
        db.session.execute(text('ALTER TABLE criancas ALTER COLUMN idade DROP NOT NULL'))
        print('Coluna idade deixou de ser obrigatória (mantida só para histórico).')

    db.session.commit()
