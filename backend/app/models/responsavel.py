import datetime

from app import db


class Responsavel(db.Model):
    __tablename__ = 'responsaveis'

    id = db.Column(db.Integer, primary_key=True)
    # id do usuário no Supabase Auth (auth.users.id) — é lá que ficam o
    # e-mail confirmado e a senha (com hash), não mais nesta tabela.
    supabase_user_id = db.Column(db.String(36), unique=True, nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    criancas = db.relationship('Crianca', backref='responsavel', lazy=True)
