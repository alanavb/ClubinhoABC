import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///clubinho.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Usados para validar o token JWT emitido pelo Supabase Auth nas rotas protegidas.
    SUPABASE_JWKS_URL = os.environ.get('SUPABASE_JWKS_URL')
