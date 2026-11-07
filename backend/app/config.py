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

    # Usados para validar o token JWT emitido pelo Supabase Auth nas rotas protegidas.
    SUPABASE_JWKS_URL = os.environ.get('SUPABASE_JWKS_URL')

    # Exclusão automática da conta no Supabase Auth. A chave secreta é usada
    # somente pelo back-end e nunca deve ser enviada ao navegador ou ao Git.
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY')

    # Proteção contra força bruta e excesso de requisições (app/limite_tentativas.py).
    LIMITE_REQUISICOES_POR_MINUTO = 120
    LIMITE_FALHAS_AUTENTICACAO = 5
    JANELA_FALHAS_SEGUNDOS = 15 * 60
    TEMPO_BLOQUEIO_SEGUNDOS = 15 * 60
