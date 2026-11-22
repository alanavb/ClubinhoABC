from app import db


class Historia(db.Model):
    __tablename__ = 'historias'

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(80), unique=True, nullable=False)
    titulo = db.Column(db.String(160), nullable=False)
    icone = db.Column(db.String(10), nullable=True)
    nivel = db.Column(db.String(40), nullable=False)
    nivel_classe = db.Column(db.String(40), nullable=False)
    objetivo = db.Column(db.Text, nullable=False)
    metodologia = db.Column(db.Text, nullable=False)
    tag = db.Column(db.String(120), nullable=False)
    tempo = db.Column(db.String(30), nullable=False)
    tema = db.Column(db.String(40), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    ordem = db.Column(db.Integer, nullable=False, default=1)
    publicada = db.Column(db.Boolean, nullable=False, default=True)
