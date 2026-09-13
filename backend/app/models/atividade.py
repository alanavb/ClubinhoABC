from app import db


class Atividade(db.Model):
    __tablename__ = 'atividades'

    id = db.Column(db.Integer, primary_key=True)
    etapa_id = db.Column(db.Integer, db.ForeignKey('etapas.id'), nullable=False)
    chave = db.Column(db.String(50), unique=True, nullable=False)  
    nome = db.Column(db.String(120), nullable=False)
    ordem = db.Column(db.Integer, nullable=False, default=1)
    obrigatoria = db.Column(db.Boolean, nullable=False, default=True)  # RN3

    resultados = db.relationship('Resultado', backref='atividade', lazy=True)
