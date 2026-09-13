import datetime

from app import db


class Crianca(db.Model):
    __tablename__ = 'criancas'

    id = db.Column(db.Integer, primary_key=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('responsaveis.id'), nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    idade = db.Column(db.Integer, nullable=False)
    avatar = db.Column(db.String(10), nullable=True)
    etapa_atual_id = db.Column(db.Integer, db.ForeignKey('etapas.id'), nullable=False)  # RN1
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    etapa_atual = db.relationship('Etapa')
    resultados = db.relationship('Resultado', backref='crianca', lazy=True)
