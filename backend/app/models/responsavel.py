import datetime

from app import db


class Responsavel(db.Model):
    __tablename__ = 'responsaveis'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=True)  # preenchido quando o RN1 (login/cadastro) existir
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    criancas = db.relationship('Crianca', backref='responsavel', lazy=True)
