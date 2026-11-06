"""RF06 — Dashboard de desempenho da criança para o responsável.

Junta os resultados registrados (RN2) por etapa, por atividade e por dia, e aponta
as atividades com mais erros como o que a criança deveria praticar mais.
"""

import datetime
from zoneinfo import ZoneInfo

from app.controllers.etapas_controller import _buscar_crianca
from app.models import Atividade, Etapa, Resultado

DIAS_DA_EVOLUCAO = 7
MAXIMO_DE_DIFICULDADES = 3

# Habilidade trabalhada em cada etapa da trilha, usada no texto da recomendação.
HABILIDADES = {
    'caca-as-letras': 'reconhecer as letras e o som de cada uma',
    'monte-a-palavra': 'juntar sílabas para formar palavras',
    'ouca-e-escolha': 'ouvir e entender frases',
    'leia-e-descubra': 'ler e entender textos curtos',
}


def _contagem(resultados):
    acertos = sum(1 for resultado in resultados if resultado.correta)
    erros = len(resultados) - acertos
    taxa = round(100 * acertos / len(resultados)) if resultados else 0
    return {'tentativas': len(resultados), 'acertos': acertos, 'erros': erros, 'taxa_acerto': taxa}


def _data_no_brasil(momento_utc):
    momento = momento_utc.replace(tzinfo=datetime.timezone.utc)
    return momento.astimezone(ZoneInfo('America/Sao_Paulo')).date()


def _evolucao(resultados, hoje):
    dias = [hoje - datetime.timedelta(days=atras) for atras in range(DIAS_DA_EVOLUCAO - 1, -1, -1)]
    por_dia = {dia: [] for dia in dias}
    for resultado in resultados:
        dia = _data_no_brasil(resultado.criado_em)
        if dia in por_dia:
            por_dia[dia].append(resultado)
    return [{'data': dia.isoformat(), **_contagem(por_dia[dia])} for dia in dias]


def _recomendacao(dificuldade):
    habilidade = HABILIDADES.get(dificuldade['etapa_chave'], 'praticar esta atividade')
    return {
        'atividade': dificuldade['nome'],
        'etapa': dificuldade['etapa_nome'],
        'texto': f'Pratique "{dificuldade["nome"]}" para reforçar como {habilidade}.',
    }


def resumo_dashboard(crianca_id, responsavel_id=None, hoje=None):
    crianca = _buscar_crianca(crianca_id, responsavel_id)
    hoje = hoje or _data_no_brasil(datetime.datetime.utcnow())

    resultados = Resultado.query.filter_by(crianca_id=crianca.id).all()
    resultados_por_atividade = {}
    for resultado in resultados:
        resultados_por_atividade.setdefault(resultado.atividade_id, []).append(resultado)

    por_etapa = []
    por_atividade = []
    for etapa in Etapa.query.order_by(Etapa.ordem).all():
        resultados_da_etapa = []
        for atividade in Atividade.query.filter_by(etapa_id=etapa.id).order_by(Atividade.ordem).all():
            resultados_da_atividade = resultados_por_atividade.get(atividade.id, [])
            resultados_da_etapa.extend(resultados_da_atividade)
            if resultados_da_atividade:
                por_atividade.append({
                    'atividade_id': atividade.id,
                    'nome': atividade.nome,
                    'etapa_chave': etapa.chave,
                    'etapa_nome': etapa.nome,
                    **_contagem(resultados_da_atividade),
                })
        por_etapa.append({'etapa_id': etapa.id, 'nome': etapa.nome, **_contagem(resultados_da_etapa)})

    # Maiores dificuldades: atividades com erro, da menor para a maior taxa de acerto.
    com_erros = [atividade for atividade in por_atividade if atividade['erros'] > 0]
    com_erros.sort(key=lambda atividade: (atividade['taxa_acerto'], -atividade['erros']))
    dificuldades = com_erros[:MAXIMO_DE_DIFICULDADES]

    return {
        'child_id': crianca.id,
        'totais': _contagem(resultados),
        'por_etapa': por_etapa,
        'evolucao': _evolucao(resultados, hoje),
        'dificuldades': dificuldades,
        'recomendacoes': [_recomendacao(dificuldade) for dificuldade in dificuldades],
    }
