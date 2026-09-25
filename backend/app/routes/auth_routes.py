from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller
from app.controllers.auditoria_controller import registrar_log
from app.controllers.auth_controller import DadosInvalidosError

auth_bp = Blueprint('auth', __name__)


def _responsavel_para_json(responsavel):
    return {
        'responsavel_id': responsavel.id,
        'nome': responsavel.nome,
        'email': responsavel.email,
        'criancas': [
            {
                'crianca_id': crianca.id,
                'nome': crianca.nome,
                'idade': crianca.idade,
                'avatar': crianca.avatar,
                'etapa_atual_id': crianca.etapa_atual_id,
            }
            for crianca in responsavel.criancas
        ],
    }


@auth_bp.route('/auth/me', methods=['GET'])
@requer_autenticacao
def me():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    registrar_log(acao='acesso_responsavel', responsavel_id=responsavel.id)
    return jsonify(_responsavel_para_json(responsavel))


@auth_bp.route('/auth/completar-cadastro', methods=['POST'])
@requer_autenticacao
def completar_cadastro():
    """Chamado pelo front assim que o Supabase confirma o e-mail e autentica o usuário
    pela primeira vez — só então o perfil (responsável + criança) é criado de fato."""
    dados = request.get_json(silent=True) or {}

    try:
        responsavel = auth_controller.completar_cadastro(
            g.supabase_user_id,
            g.supabase_email,
            dados.get('nome'),
            dados.get('crianca_nome'),
            dados.get('crianca_idade'),
            dados.get('crianca_avatar'),
        )
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400

    return jsonify(_responsavel_para_json(responsavel)), 201
