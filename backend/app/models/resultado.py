import datetime

from app import db


# RN2: modelo de tentativa em uma atividade
class Resultado(db.Model):

    __tablename__ = 'resultados'

    # Dados da resposta enviada pela criança
    id = db.Column(db.Integer, primary_key=True)
    crianca_id = db.Column(db.Integer, db.ForeignKey('criancas.id'), nullable=False)
    atividade_id = db.Column(db.Integer, db.ForeignKey('atividades.id'), nullable=False)
    resposta = db.Column(db.String(255), nullable=False)
    correta = db.Column(db.Boolean, nullable=False)
    # Marca somente a tentativa correta que encerrou todas as rodadas da atividade.
    concluindo_atividade = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Conversão do resultado para resposta da API
    def to_dict(self):
        return {
            'child_id': self.crianca_id,
            'activity_id': self.atividade_id,
            'answer': self.resposta,
            'correct': self.correta,
        }
