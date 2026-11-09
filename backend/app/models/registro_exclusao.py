import datetime

from app import db

class RegistroExclusao(db.Model):
    """Registro mínimo de que uma exclusão aconteceu: apenas a ação e o horário.

    Não guarda ids, nome, nem e-mail e não tem chave estrangeira, de propósito:
    a exclusão apaga os dados da criança e da família, e este registro não pode
    reter nada que permita identificá-las."""

    __tablename__ = 'registro_exclusao'

    id = db.Column(db.Integer, primary_key=True)
    acao = db.Column(db.String(80), nullable=False)
    criado_em  = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.datetime.utcnow
)