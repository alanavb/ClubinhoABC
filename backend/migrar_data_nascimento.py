"""Migração: criancas.idade -> criancas.data_nascimento.

Só acrescenta: cria a coluna data_nascimento e tira a obrigatoriedade de idade
(o código novo não grava mais idade). Nenhum dado é apagado e pode rodar várias vezes.
O seeds.py chama esta função, então quem roda o seeds já fica com o banco atualizado.
"""

from sqlalchemy import inspect, text

from app import create_app, db


def migrar():
    colunas = {coluna['name'] for coluna in inspect(db.engine).get_columns('criancas')}

    if 'data_nascimento' not in colunas:
        db.session.execute(text('ALTER TABLE criancas ADD COLUMN data_nascimento DATE'))
        print('Coluna data_nascimento criada.')

    # SQLite não tem ALTER COLUMN; um banco SQLite antigo com idade obrigatória
    # deve ser apagado (instance/clubinho.db) e recriado pelo seeds.py.
    if 'idade' in colunas and db.engine.dialect.name == 'postgresql':
        db.session.execute(text('ALTER TABLE criancas ALTER COLUMN idade DROP NOT NULL'))

    db.session.commit()


if __name__ == '__main__':
    with create_app().app_context():
        migrar()
        print('Migração concluída.')
