from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, dashboard_controller
from app.controllers.dashboard_controller import FiltroInvalidoError
from app.controllers.etapas_controller import AcessoNegadoError
from app.error_responses import MENSAGEM_ACESSO_NEGADO, erro_publico

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/criancas/<int:crianca_id>/dashboard', methods=['GET'])
@requer_autenticacao
# Rota do painel de progresso da criança
def dashboard_da_crianca(crianca_id):
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    # Filtros opcionais: ?periodo=7|30|tudo&etapa=<id>
    periodo = request.args.get('periodo', 'tudo')
    etapa_id = request.args.get('etapa', type=int)
    try:
        resumo = dashboard_controller.resumo_dashboard(
            crianca_id, responsavel_id=responsavel.id, periodo=periodo, etapa_id=etapa_id,
        )
    except FiltroInvalidoError as erro:
        return jsonify({'erro': str(erro)}), 400
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError:
        return erro_publico(MENSAGEM_ACESSO_NEGADO, 403)

    return jsonify(resumo)
