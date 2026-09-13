import datetime

from app import db


class Resultado(db.Model):
    """RN2 — registro do resultado de uma tentativa da criança numa atividade."""

    __tablename__ = 'resultados'

    id = db.Column(db.Integer, primary_key=True)
    crianca_id = db.Column(db.Integer, db.ForeignKey('criancas.id'), nullable=False)
    atividade_id = db.Column(db.Integer, db.ForeignKey('atividades.id'), nullable=False)
    resposta = db.Column(db.String(50), nullable=False)
    correta = db.Column(db.Boolean, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'child_id': self.crianca_id,
            'activity_id': self.atividade_id,
            'answer': self.resposta,
            'correct': self.correta,
        }
