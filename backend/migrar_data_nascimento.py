"""Ajustes de colunas em bancos que já existem. Só acrescenta e pode rodar várias vezes.

O seeds.py chama migrar(), então rodar o seeds já atualiza o banco.
"""

from sqlalchemy import inspect, text

from app import create_app, db


def migrar():
    colunas = {coluna['name'] for coluna in inspect(db.engine).get_columns('criancas')}

    if 'data_nascimento' not in colunas:
        db.session.execute(text('ALTER TABLE criancas ADD COLUMN data_nascimento DATE'))
        print('Coluna data_nascimento criada.')

    # SQLite não tem ALTER COLUMN: banco SQLite antigo precisa ser recriado
    if 'idade' in colunas and db.engine.dialect.name == 'postgresql':
        db.session.execute(text('ALTER TABLE criancas ALTER COLUMN idade DROP NOT NULL'))

    # frases da Etapa 3 chegam a 65 caracteres; só o Postgres impõe o tamanho
    if db.engine.dialect.name == 'postgresql':
        db.session.execute(text('ALTER TABLE resultados ALTER COLUMN resposta TYPE VARCHAR(255)'))

    colunas_responsavel = {coluna['name'] for coluna in inspect(db.engine).get_columns('responsaveis')}
    if 'sessao_ativa_id' not in colunas_responsavel:
        db.session.execute(text('ALTER TABLE responsaveis ADD COLUMN sessao_ativa_id VARCHAR(36)'))
        print('Coluna sessao_ativa_id criada.')

    db.session.commit()


if __name__ == '__main__':
    with create_app().app_context():
        migrar()
        print('Migração concluída.')
