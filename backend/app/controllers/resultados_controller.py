# RN2: registro de cada tentativa da criança

from app import db
from app.controllers.auditoria_controller import registrar_log
from app.controllers.etapas_controller import AcessoNegadoError, avancar_etapa_se_concluida
from app.models import Atividade, Crianca, Resultado


# Registro de uma tentativa da criança
def registrar_resultado(crianca_id, atividade_id, resposta_enviada, resposta_esperada, responsavel_id=None):
    crianca = Crianca.query.get(crianca_id)
    if not crianca:
        raise ValueError('Criança não encontrada')
    if responsavel_id is not None and crianca.responsavel_id != responsavel_id:
        raise AcessoNegadoError('Esta criança não pertence ao responsável autenticado')

    atividade = Atividade.query.get(atividade_id)
    if not atividade:
        raise ValueError('Atividade não encontrada')

    # RN1: bloqueia etapas futuras e permite revisão
    if atividade.etapa.ordem > crianca.etapa_atual.ordem:
        raise AcessoNegadoError('Esta atividade ainda não foi liberada para a criança')

    correta = resposta_enviada == resposta_esperada  # RN2: o sistema verifica a resposta

    resultado = Resultado(
        crianca_id=crianca_id,
        atividade_id=atividade_id,
        resposta=resposta_enviada,
        correta=correta,
    )
    db.session.add(resultado)
    db.session.flush()

    # RN3: apenas obrigatórias liberam a próxima etapa
    if correta and getattr(atividade, 'obrigatoria', True) and atividade.etapa_id == crianca.etapa_atual_id:
        avancar_etapa_se_concluida(
            crianca_id,
            atividade.etapa_id,
            responsavel_id=responsavel_id,
            confirmar=False,
        )
    db.session.commit()

    registrar_log(
        acao='atividade_realizada' if correta else 'atividade_tentativa',
        responsavel_id=responsavel_id,
        crianca_id=crianca_id,
        detalhes=f'atividade={atividade.chave} correta={correta}',
    )

    return resultado


# Consulta de resultados com filtros de acesso
def listar_resultados(crianca_id=None, atividade_id=None, responsavel_id=None):
    if crianca_id is not None and responsavel_id is not None:
        crianca = Crianca.query.get(crianca_id)
        if crianca and crianca.responsavel_id != responsavel_id:
            raise AcessoNegadoError('Esta criança não pertence ao responsável autenticado')

    query = Resultado.query
    if responsavel_id is not None:
        # Restringe resultados à família autenticada
        query = query.join(Crianca).filter(Crianca.responsavel_id == responsavel_id)
    if crianca_id is not None:
        query = query.filter(Resultado.crianca_id == crianca_id)
    if atividade_id is not None:
        query = query.filter(Resultado.atividade_id == atividade_id)
    return query.order_by(Resultado.criado_em.desc()).all()
