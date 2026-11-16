from flask import Blueprint, g, jsonify

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, etapas_controller
from app.controllers.etapas_controller import AcessoNegadoError
from app.error_responses import MENSAGEM_ACESSO_NEGADO, erro_publico

etapas_bp = Blueprint('etapas', __name__)


# Identificação do responsável autenticado
def _responsavel_atual():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return None, (jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404)
    return responsavel.id, None


@etapas_bp.route('/criancas/<int:crianca_id>/atividades', methods=['GET'])
@requer_autenticacao
# Rota de atividades acessíveis da criança
def atividades_acessiveis(crianca_id):
    # RN1: retorna atividades da etapa atual
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        crianca, atividades = etapas_controller.listar_atividades_acessiveis(
            crianca_id, responsavel_id=responsavel_id
        )
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify({
        'child_id': crianca.id,
        'etapa_atual_id': crianca.etapa_atual_id,
        'atividades': [
            {
                'activity_id': atividade.id,
                'chave': atividade.chave,
                'nome': atividade.nome,
                'obrigatoria': atividade.obrigatoria,
            }
            for atividade in atividades
        ],
    })


@etapas_bp.route('/criancas/<int:crianca_id>/progresso', methods=['GET'])
@requer_autenticacao
# Rota de progresso da criança
def progresso_da_crianca(crianca_id):
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        resumo = etapas_controller.resumo_progresso(crianca_id, responsavel_id=responsavel_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify(resumo)


@etapas_bp.route('/etapas/<string:chave_etapa>/atividades', methods=['GET'])
@requer_autenticacao
# Rota de atividades por etapa
def atividades_da_etapa(chave_etapa):
    # Localiza atividades pela chave da etapa
    try:
        etapa, atividades = etapas_controller.listar_atividades_por_etapa(chave_etapa)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

    return jsonify({
        'etapa_id': etapa.id,
        'chave': etapa.chave,
        'atividades': [
            {
                'activity_id': atividade.id,
                'chave': atividade.chave,
                'nome': atividade.nome,
                'obrigatoria': atividade.obrigatoria,
            }
            for atividade in atividades
        ],
    })


@etapas_bp.route('/criancas/<int:crianca_id>/etapas/<int:etapa_id>/status', methods=['GET'])
@requer_autenticacao
# Rota de status da etapa
def etapa_status(crianca_id, etapa_id):
    # RN3: informa a conclusão das obrigatórias
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        status = etapas_controller.status_etapa(crianca_id, etapa_id, responsavel_id=responsavel_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify(status)


@etapas_bp.route('/criancas/<int:crianca_id>/etapas/<int:etapa_id>/concluir', methods=['POST'])
@requer_autenticacao
# Rota de confirmação de conclusão da etapa
def concluir_etapa(crianca_id, etapa_id):
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        resultado = etapas_controller.avancar_etapa_se_concluida(
            crianca_id, etapa_id, responsavel_id=responsavel_id
        )
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify(resultado)
