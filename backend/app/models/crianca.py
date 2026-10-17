import datetime

from app import db

IDADE_MINIMA = 6
IDADE_MAXIMA = 7


class Crianca(db.Model):
    __tablename__ = 'criancas'

    id = db.Column(db.Integer, primary_key=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('responsaveis.id'), nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    # A idade não é guardada: muda com o tempo. É calculada a partir da data de nascimento.
    data_nascimento = db.Column(db.Date, nullable=True)  # nullable só para cadastros antigos, sem a data
    avatar = db.Column(db.String(10), nullable=True)
    etapa_atual_id = db.Column(db.Integer, db.ForeignKey('etapas.id'), nullable=False)  # RN1
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    etapa_atual = db.relationship('Etapa')
    resultados = db.relationship('Resultado', backref='crianca', lazy=True)

    def idade(self, hoje=None):
        if not self.data_nascimento:
            return None
        hoje = hoje or datetime.date.today()
        nascimento = self.data_nascimento
        return hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))

    def fora_da_faixa_etaria(self, hoje=None):
        idade = self.idade(hoje)
        return idade is not None and not IDADE_MINIMA <= idade <= IDADE_MAXIMA
