import datetime

from app import db


class Responsavel(db.Model):
    __tablename__ = 'responsaveis'

    id = db.Column(db.Integer, primary_key=True)
    # auth.users.id no Supabase; a senha fica lá, não aqui
    supabase_user_id = db.Column(db.String(36), unique=True, nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # session_id do último login (sessão única)
    sessao_ativa_id = db.Column(db.String(36), nullable=True)

    criancas = db.relationship('Crianca', backref='responsavel', lazy=True)
