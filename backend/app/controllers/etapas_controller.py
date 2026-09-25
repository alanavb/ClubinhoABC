"""RN1 — Atividade pertence a uma etapa (controle de acesso)
RN3 — Atividade obrigatória (conclusão da etapa)
"""

from app.models import Atividade, Crianca, Resultado


class AcessoNegadoError(Exception):
    """RN1: a criança tentou acessar uma atividade fora da sua etapa atual,
    ou o responsável logado não é o responsável por essa criança."""


def _buscar_crianca(crianca_id, responsavel_id=None):
    crianca = Crianca.query.get(crianca_id)
    if not crianca:
        raise ValueError('Criança não encontrada')
    if responsavel_id is not None and crianca.responsavel_id != responsavel_id:
        raise AcessoNegadoError('Esta criança não pertence ao responsável autenticado')
    return crianca


def pode_acessar_atividade(crianca_id, atividade_id):
    """RN1: a criança só pode acessar atividades da etapa em que se encontra."""
    crianca = _buscar_crianca(crianca_id)

    atividade = Atividade.query.get(atividade_id)
    if not atividade:
        raise ValueError('Atividade não encontrada')

    return atividade.etapa_id == crianca.etapa_atual_id


def listar_atividades_acessiveis(crianca_id, responsavel_id=None):
    """RN1: lista só as atividades da etapa atual da criança."""
    crianca = _buscar_crianca(crianca_id, responsavel_id)

    atividades = (
        Atividade.query
        .filter_by(etapa_id=crianca.etapa_atual_id)
        .order_by(Atividade.ordem)
        .all()
    )
    return crianca, atividades

def status_etapa(crianca_id, etapa_id, responsavel_id=None):
    crianca = _buscar_crianca(crianca_id, responsavel_id) #A etapa só concluí quando todas as atividades obrigatórias tiverem ao menos um resultado correto.

    atividades = Atividade.query.filter_by(etapa_id=etapa_id).order_by(Atividade.ordem).all()
    if not atividades:
        raise ValueError('Etapa não encontrada ou sem atividades')

    detalhes = []
    for atividade in atividades:
        realizada = (
            Resultado.query
            .filter_by(crianca_id=crianca.id, atividade_id=atividade.id, correta=True)
            .first()
            is not None
        )
        detalhes.append({
            'activity_id': atividade.id,
            'nome': atividade.nome,
            'obrigatoria': atividade.obrigatoria,
            'realizada': realizada,
        })

    obrigatorias = [item for item in detalhes if item['obrigatoria']]
    concluida = len(obrigatorias) > 0 and all(item['realizada'] for item in obrigatorias)

    return {
        'etapa_id': etapa_id,
        'child_id': crianca.id,
        'concluida': concluida,
        'atividades': detalhes,
    }
