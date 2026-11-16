from app import db
from app.models import LogAuditoria, RegistroExclusao

# Registro de evento de auditoria
def registrar_log(acao, responsavel_id=None, crianca_id=None, detalhes=None):
    log = LogAuditoria(
        acao = acao,
        responsavel_id = responsavel_id,
        crianca_id = crianca_id,
        detalhes = detalhes,
    )
    db.session.add(log)
    db.session.commit()
    return log

# Registro de exclusão da conta autenticada
def registrar_exclusao(acao):
    # Registro na mesma transação da exclusão
    db.session.add(RegistroExclusao(acao=acao))


# Consulta de registros de auditoria
def listar_logs(responsavel_id=None, crianca_id=None):
    query = LogAuditoria.query
    if responsavel_id:
        query = query.filter_by(responsavel_id=responsavel_id)
    if crianca_id:
        query = query.filter_by(crianca_id=crianca_id)
    return query.order_by(LogAuditoria.criando_em.desc()).all()
