from flask import Blueprint, g, jsonify

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, etapas_controller
from app.controllers.etapas_controller import AcessoNegadoError

etapas_bp = Blueprint('etapas', __name__)


def _responsavel_atual():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return None, (jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404)
    return responsavel.id, None


@etapas_bp.route('/criancas/<int:crianca_id>/atividades', methods=['GET'])
@requer_autenticacao
def atividades_acessiveis(crianca_id):
    """RN1 — só devolve as atividades da etapa atual da criança."""
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        crianca, atividades = etapas_controller.listar_atividades_acessiveis(
            crianca_id, responsavel_id=responsavel_id
        )
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError as erro:
        return jsonify({'erro': str(erro)}), 403

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


@etapas_bp.route('/criancas/<int:crianca_id>/etapas/<int:etapa_id>/status', methods=['GET'])
@requer_autenticacao
def etapa_status(crianca_id, etapa_id):
    """RN3 — diz se a etapa está concluída (todas as obrigatórias feitas)."""
    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        status = etapas_controller.status_etapa(crianca_id, etapa_id, responsavel_id=responsavel_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError as erro:
        return jsonify({'erro': str(erro)}), 403

    return jsonify(status)
