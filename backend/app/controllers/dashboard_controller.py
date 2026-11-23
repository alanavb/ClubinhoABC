# RF06: indicadores de desempenho do painel

import datetime
from zoneinfo import ZoneInfo

from app.controllers.etapas_controller import _buscar_crianca
from app.models import Atividade, Etapa, Resultado

DIAS_DA_EVOLUCAO = 7
MAXIMO_DE_DIFICULDADES = 3
# Filtro de período: quantos dias entram na conta (None = desde o início)
PERIODOS = {'7': 7, '30': 30, 'tudo': None}

# Recomendações por etapa
HABILIDADES = {
    'caca-as-letras': 'reconhecer as letras e o som de cada uma',
    'monte-a-palavra': 'juntar sílabas para formar palavras',
    'ouca-e-escolha': 'ouvir e entender frases',
    'leia-e-descubra': 'ler e entender textos curtos',
}


# Erro de filtro com valor desconhecido
class FiltroInvalidoError(Exception):
    pass


# Contagem de acertos e erros
def _contagem(resultados):
    acertos = sum(1 for resultado in resultados if resultado.correta)
    erros = len(resultados) - acertos
    taxa = round(100 * acertos / len(resultados)) if resultados else 0
    return {'tentativas': len(resultados), 'acertos': acertos, 'erros': erros, 'taxa_acerto': taxa}


# Conversão de data para o fuso brasileiro
def _data_no_brasil(momento_utc):
    momento = momento_utc.replace(tzinfo=datetime.timezone.utc)
    return momento.astimezone(ZoneInfo('America/Sao_Paulo')).date()


# Cálculo da evolução recente
def _evolucao(resultados, hoje, quantidade_de_dias=DIAS_DA_EVOLUCAO):
    dias = [hoje - datetime.timedelta(days=atras) for atras in range(quantidade_de_dias - 1, -1, -1)]
    por_dia = {dia: [] for dia in dias}
    for resultado in resultados:
        dia = _data_no_brasil(resultado.criado_em)
        if dia in por_dia:
            por_dia[dia].append(resultado)
    return [{'data': dia.isoformat(), **_contagem(por_dia[dia])} for dia in dias]


# Texto de recomendação por dificuldade
def _recomendacao(dificuldade):
    habilidade = HABILIDADES.get(dificuldade['etapa_chave'], 'praticar esta atividade')
    return {
        'atividade': dificuldade['nome'],
        'etapa': dificuldade['etapa_nome'],
        'texto': f'Pratique "{dificuldade["nome"]}" para reforçar como {habilidade}.',
    }


# Dados do painel de progresso
def resumo_dashboard(crianca_id, responsavel_id=None, hoje=None, periodo='tudo', etapa_id=None):
    if periodo not in PERIODOS:
        raise FiltroInvalidoError('Período inválido. Use 7, 30 ou tudo.')
    crianca = _buscar_crianca(crianca_id, responsavel_id)
    hoje = hoje or _data_no_brasil(datetime.datetime.utcnow())

    etapas = Etapa.query.order_by(Etapa.ordem).all()
    if etapa_id is not None:
        etapas = [etapa for etapa in etapas if etapa.id == etapa_id]
        if not etapas:
            raise FiltroInvalidoError('Etapa inválida.')

    resultados = Resultado.query.filter_by(crianca_id=crianca.id).all()
    # Filtro de período: só as tentativas dos últimos N dias (no fuso do Brasil)
    dias = PERIODOS[periodo]
    if dias:
        inicio = hoje - datetime.timedelta(days=dias - 1)
        resultados = [resultado for resultado in resultados if _data_no_brasil(resultado.criado_em) >= inicio]
    resultados_por_atividade = {}
    for resultado in resultados:
        resultados_por_atividade.setdefault(resultado.atividade_id, []).append(resultado)

    por_etapa = []
    por_atividade = []
    resultados_filtrados = []  # só as tentativas das etapas escolhidas no filtro
    for etapa in etapas:
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
        resultados_filtrados.extend(resultados_da_etapa)

    # Prioriza atividades com menor taxa de acerto
    com_erros = [atividade for atividade in por_atividade if atividade['erros'] > 0]
    com_erros.sort(key=lambda atividade: (atividade['taxa_acerto'], -atividade['erros']))
    dificuldades = com_erros[:MAXIMO_DE_DIFICULDADES]

    return {
        'child_id': crianca.id,
        'periodo': periodo,
        'etapa_id': etapa_id,
        'totais': _contagem(resultados_filtrados),
        'por_etapa': por_etapa,
        'evolucao': _evolucao(resultados_filtrados, hoje, 30 if periodo == '30' else DIAS_DA_EVOLUCAO),
        'dificuldades': dificuldades,
        'recomendacoes': [_recomendacao(dificuldade) for dificuldade in dificuldades],
    }
