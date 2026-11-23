# Versionamento dos Termos de Uso e da Política de Privacidade e registro dos aceites

import datetime

from app import db
from app.models import Aceite, DocumentoLegal

TIPOS = ('termos', 'privacidade')


# Erro de aceite de documento que não está vigente
class AceiteInvalidoError(Exception):
    pass


# Versão vigente de um tipo: a mais recente que já entrou em vigor
def documento_vigente(tipo, hoje=None):
    hoje = hoje or datetime.date.today()
    return (
        DocumentoLegal.query
        .filter(DocumentoLegal.tipo == tipo, DocumentoLegal.vigente_desde <= hoje)
        .order_by(DocumentoLegal.vigente_desde.desc(), DocumentoLegal.id.desc())
        .first()
    )


# Versões vigentes de todos os tipos cadastrados
def documentos_vigentes(hoje=None):
    vigentes = [documento_vigente(tipo, hoje) for tipo in TIPOS]
    return [documento for documento in vigentes if documento]


# Versões vigentes que o responsável ainda não aceitou
def documentos_pendentes(responsavel, hoje=None):
    aceitos = {
        aceite.documento_id
        for aceite in Aceite.query.filter_by(responsavel_id=responsavel.id).all()
    }
    return [documento for documento in documentos_vigentes(hoje) if documento.id not in aceitos]


# Registro dos aceites no cadastro: guarda as versões que a pessoa viu ao se cadastrar
def registrar_aceites_do_cadastro(responsavel, documento_ids):
    ids = {int(documento_id) for documento_id in (documento_ids or []) if str(documento_id).isdigit()}
    documentos = DocumentoLegal.query.filter(DocumentoLegal.id.in_(ids)).all() if ids else []
    for documento in documentos:
        db.session.add(Aceite(responsavel_id=responsavel.id, documento_id=documento.id))
    return len(documentos)


# Novo aceite depois do login: só aceita versões vigentes
def aceitar_documentos(responsavel, documento_ids, hoje=None):
    vigentes = {documento.id for documento in documentos_vigentes(hoje)}
    try:
        ids = {int(documento_id) for documento_id in documento_ids or []}
    except (TypeError, ValueError):
        raise AceiteInvalidoError('Documento inválido.') from None
    if not ids or not ids <= vigentes:
        raise AceiteInvalidoError('Só é possível aceitar a versão vigente dos documentos.')

    ja_aceitos = {
        aceite.documento_id
        for aceite in Aceite.query.filter_by(responsavel_id=responsavel.id).all()
    }
    for documento_id in ids - ja_aceitos:
        db.session.add(Aceite(responsavel_id=responsavel.id, documento_id=documento_id))
    db.session.commit()
