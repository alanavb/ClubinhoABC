import os

from dotenv import load_dotenv

load_dotenv()


# Configurações da aplicação e serviços externos
class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///clubinho.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.environ.get('PORT', '5000'))
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    CORS_ALLOWED_ORIGINS = os.environ.get(
        'CORS_ALLOWED_ORIGINS', 'http://localhost:5173'
    ).split(',')

    # Chave pública para validar o JWT
    SUPABASE_JWKS_URL = os.environ.get('SUPABASE_JWKS_URL')

    # Credenciais administrativas do Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY')

    # Limite de requisições por IP
    LIMITE_REQUISICOES_POR_MINUTO = 120
    LIMITE_FALHAS_AUTENTICACAO = 5
    JANELA_FALHAS_SEGUNDOS = 15 * 60
    TEMPO_BLOQUEIO_SEGUNDOS = 15 * 60
