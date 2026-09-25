import datetime

from app import db

class LogAuditoria(db.Model):

    """Log de auditoria — registro rastreável de ações no sistema:
    acessos, alterações de cadastro, exclusões e atividades realizadas
    ou tentadas pelas crianças."""

    __tablename__ = 'log_auditoria'

    id = db.Column(db.Integer, primary_key=True)
    acao = db.Column(db.String(80), nullable=False)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('responsavel.id'), nullable=False)
    crianca_id = db.Column(db.Integer, db.ForeignKey('crianca.id'), nullable=False)
    detalhes = db.Column(db.Text, nullable=True)
    criando_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

def to_dict(self):
    return {
            'id': self.id,
            'acao': self.acao,
            'responsavel_id': self.responsavel_id,
            'crianca_id': self.crianca_id,
            'detalhes': self.detalhes,
            'criando_em': self.criando_em.isoformat(),
        }