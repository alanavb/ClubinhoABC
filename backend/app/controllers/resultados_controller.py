"""RN2 — Registro do resultado da atividade.
"""

from app import db
from app.controllers.etapas_controller import AcessoNegadoError
from app.models import Atividade, Crianca, Resultado


def registrar_resultado(crianca_id, atividade_id, resposta_enviada, resposta_esperada):
    crianca = Crianca.query.get(crianca_id)
    if not crianca:
        raise ValueError('Criança não encontrada')

    atividade = Atividade.query.get(atividade_id)
    if not atividade:
        raise ValueError('Atividade não encontrada')

    if atividade.etapa_id != crianca.etapa_atual_id:  # RN1
        raise AcessoNegadoError('Esta atividade não pertence à etapa atual da criança')

    correta = resposta_enviada == resposta_esperada  # RN2: o sistema verifica a resposta

    resultado = Resultado(
        crianca_id=crianca_id,
        atividade_id=atividade_id,
        resposta=resposta_enviada,
        correta=correta,
    )
    db.session.add(resultado)
    db.session.commit()
    return resultado


def listar_resultados(crianca_id=None, atividade_id=None):
    query = Resultado.query
    if crianca_id is not None:
        query = query.filter_by(crianca_id=crianca_id)
    if atividade_id is not None:
        query = query.filter_by(atividade_id=atividade_id)
    return query.order_by(Resultado.criado_em.desc()).all()
