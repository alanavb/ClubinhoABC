from app import db


class Etapa(db.Model):
    __tablename__ = 'etapas'

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(50), unique=True, nullable=False)  
    nome = db.Column(db.String(120), nullable=False)
    ordem = db.Column(db.Integer, nullable=False, default=1)

    atividades = db.relationship('Atividade', backref='etapa', lazy=True)
