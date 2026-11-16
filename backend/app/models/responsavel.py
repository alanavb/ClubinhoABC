import datetime

from app import db


class Responsavel(db.Model):
    __tablename__ = 'responsaveis'

    id = db.Column(db.Integer, primary_key=True)
    # Identificador do usuário no Supabase Auth
    supabase_user_id = db.Column(db.String(36), unique=True, nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # Identificador da sessão única ativa
    sessao_ativa_id = db.Column(db.String(36), nullable=True)

    criancas = db.relationship('Crianca', backref='responsavel', lazy=True)
