from app import db


class Material(db.Model):
    #Material pedagógico disponível para baixar ou imprimir.
    __tablename__ = 'materiais'

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(80), unique=True, nullable=False)
    titulo = db.Column(db.String(160), nullable=False)
    eixo = db.Column(db.String(180), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    arquivo = db.Column(db.String(255), nullable=False)
    paginas = db.Column(db.Integer, nullable=False)
    icone = db.Column(db.String(10), nullable=True)
    tom = db.Column(db.String(30), nullable=True)
    categoria = db.Column(db.String(80), nullable=False)
    ordem = db.Column(db.Integer, nullable=False, default=1)
    destaque = db.Column(db.Boolean, nullable=False, default=False)
    publicado = db.Column(db.Boolean, nullable=False, default=True)


class ReferenciaMaterial(db.Model):
    #Fonte exibida na página de materiais.
    __tablename__ = 'referencias_materiais'

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(80), unique=True, nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    veiculo = db.Column(db.String(120), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    ativa = db.Column(db.Boolean, nullable=False, default=True)
