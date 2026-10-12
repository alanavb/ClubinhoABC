
from app import db
from app.models import Atividade, Crianca, Etapa, Resultado


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
    # RN1: a criança só pode acessar atividades da etapa em que se encontra
    crianca = _buscar_crianca(crianca_id)

    atividade = Atividade.query.get(atividade_id)
    if not atividade:
        raise ValueError('Atividade não encontrada')

    return atividade.etapa_id == crianca.etapa_atual_id


def listar_atividades_acessiveis(crianca_id, responsavel_id=None):
    #RN1: lista só as atividades da etapa atual da criança
    crianca = _buscar_crianca(crianca_id, responsavel_id)

    atividades = (
        Atividade.query
        .filter_by(etapa_id=crianca.etapa_atual_id)
        .order_by(Atividade.ordem)
        .all()
    )
    return crianca, atividades


def listar_atividades_por_etapa(chave_etapa):
    etapa = Etapa.query.filter_by(chave=chave_etapa).first()
    if not etapa:
        raise ValueError('Etapa não encontrada')

    atividades = Atividade.query.filter_by(etapa_id=etapa.id).order_by(Atividade.ordem).all()
    return etapa, atividades


def resumo_progresso(crianca_id, responsavel_id=None):
    crianca = _buscar_crianca(crianca_id, responsavel_id)
    estrelas = 0
    atividades_concluidas = 0

    for atividade in Atividade.query.order_by(Atividade.ordem).all():
        foi_concluida = (
            Resultado.query
            .filter_by(crianca_id=crianca.id, atividade_id=atividade.id, correta=True)
            .first()
            is not None
        )
        if foi_concluida:
            atividades_concluidas += 1
            estrelas += 1 if atividade.obrigatoria else 2

    return {
        'child_id': crianca.id,
        'estrelas': estrelas,
        'atividades_concluidas': atividades_concluidas,
    }

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
            'chave': getattr(atividade, 'chave', None),
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


def avancar_etapa_se_concluida(crianca_id, etapa_id, responsavel_id=None):
    crianca = _buscar_crianca(crianca_id, responsavel_id)
    if crianca.etapa_atual_id != etapa_id:
        raise AcessoNegadoError('Esta não é a etapa atual da criança')

    status = status_etapa(crianca_id, etapa_id, responsavel_id)
    if not status['concluida']:
        return {**status, 'avancou': False, 'proxima_etapa': None}

    etapa_atual = Etapa.query.get(etapa_id)
    proxima_etapa = (
        Etapa.query
        .filter(Etapa.ordem > etapa_atual.ordem)
        .order_by(Etapa.ordem)
        .first()
    )
    if not proxima_etapa:
        return {**status, 'avancou': False, 'proxima_etapa': None}

    crianca.etapa_atual_id = proxima_etapa.id
    db.session.commit()
    return {
        **status,
        'avancou': True,
        'proxima_etapa': {
            'id': proxima_etapa.id,
            'chave': proxima_etapa.chave,
            'nome': proxima_etapa.nome,
        },
    }
