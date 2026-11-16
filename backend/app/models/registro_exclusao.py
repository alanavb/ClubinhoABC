import datetime

from app import db

# Modelo de registro mínimo de exclusões
class RegistroExclusao(db.Model):

    __tablename__ = 'registro_exclusao'

    # Ação registrada e horário da exclusão
    id = db.Column(db.Integer, primary_key=True)
    acao = db.Column(db.String(80), nullable=False)
    criado_em = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.datetime.utcnow
    )
