# Migração de colunas para bancos já existentes
# O seeds.py executa esta migração automaticamente

from sqlalchemy import inspect, text

from app import create_app, db


# Atualização das colunas do banco de dados
def migrar():
    colunas = {coluna['name'] for coluna in inspect(db.engine).get_columns('criancas')}

    if 'data_nascimento' not in colunas:
        db.session.execute(text('ALTER TABLE criancas ADD COLUMN data_nascimento DATE'))
        print('Coluna data_nascimento criada.')

    # Ajuste de coluna aceito apenas pelo PostgreSQL
    if 'idade' in colunas and db.engine.dialect.name == 'postgresql':
        db.session.execute(text('ALTER TABLE criancas ALTER COLUMN idade DROP NOT NULL'))

    # Ampliação da resposta para frases enviadas pelos jogos
    if db.engine.dialect.name == 'postgresql':
        db.session.execute(text('ALTER TABLE resultados ALTER COLUMN resposta TYPE VARCHAR(255)'))

    colunas_responsavel = {coluna['name'] for coluna in inspect(db.engine).get_columns('responsaveis')}
    if 'sessao_ativa_id' not in colunas_responsavel:
        db.session.execute(text('ALTER TABLE responsaveis ADD COLUMN sessao_ativa_id VARCHAR(36)'))
        print('Coluna sessao_ativa_id criada.')

    db.session.commit()


# Execução direta da migração
if __name__ == '__main__':
    with create_app().app_context():
        migrar()
        print('Migração concluída.')
