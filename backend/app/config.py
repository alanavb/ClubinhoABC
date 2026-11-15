import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///clubinho.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.environ.get('PORT', '5000'))
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    CORS_ALLOWED_ORIGINS = os.environ.get(
        'CORS_ALLOWED_ORIGINS', 'http://localhost:5173'
    ).split(',')

    # chave pública para validar o JWT do Supabase
    SUPABASE_JWKS_URL = os.environ.get('SUPABASE_JWKS_URL')

    # só para excluir a conta no Supabase Auth; nunca vai para o front nem para o Git
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY')

    # ver app/limite_tentativas.py
    LIMITE_REQUISICOES_POR_MINUTO = 120
    LIMITE_FALHAS_AUTENTICACAO = 5
    JANELA_FALHAS_SEGUNDOS = 15 * 60
    TEMPO_BLOQUEIO_SEGUNDOS = 15 * 60
