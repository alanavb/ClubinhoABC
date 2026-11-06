from flask import Blueprint, g, jsonify

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, dashboard_controller
from app.controllers.etapas_controller import AcessoNegadoError
from app.error_responses import MENSAGEM_ACESSO_NEGADO, erro_publico

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/criancas/<int:crianca_id>/dashboard', methods=['GET'])
@requer_autenticacao
def dashboard_da_crianca(crianca_id):
    """RF06 — indicadores de desempenho da criança para o responsável."""
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    try:
        resumo = dashboard_controller.resumo_dashboard(crianca_id, responsavel_id=responsavel.id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify(resumo)
