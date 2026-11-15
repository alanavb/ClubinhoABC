import datetime

from app import db

class RegistroExclusao(db.Model):
    """Só ação e horário. Sem ids nem FK: depois da exclusão nada pode identificar a família (LGPD)."""

    __tablename__ = 'registro_exclusao'

    id = db.Column(db.Integer, primary_key=True)
    acao = db.Column(db.String(80), nullable=False)
    criado_em  = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.datetime.utcnow
)