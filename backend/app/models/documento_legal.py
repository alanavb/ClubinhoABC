import datetime

from app import db


# Versão dos Termos de Uso ou da Política de Privacidade
class DocumentoLegal(db.Model):
    __tablename__ = 'documentos_legais'
    # Cada tipo tem no máximo uma linha por versão
    __table_args__ = (db.UniqueConstraint('tipo', 'versao', name='uq_documento_tipo_versao'),)

    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False)  # 'termos' ou 'privacidade'
    versao = db.Column(db.String(10), nullable=False)
    vigente_desde = db.Column(db.Date, nullable=False)
    # Texto simples: "## " é título, "- " é item de lista e **texto** é negrito
    conteudo = db.Column(db.Text, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# Registro de que um responsável aceitou uma versão de um documento
class Aceite(db.Model):
    __tablename__ = 'aceites'

    id = db.Column(db.Integer, primary_key=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('responsaveis.id'), nullable=False)
    documento_id = db.Column(db.Integer, db.ForeignKey('documentos_legais.id'), nullable=False)
    aceito_em = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    documento = db.relationship('DocumentoLegal')
