from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller
from app.controllers.auditoria_controller import registrar_log
from app.controllers.auth_controller import DadosInvalidosError

auth_bp = Blueprint('auth', __name__)


def _crianca_para_json(crianca):
    return {
        'crianca_id': crianca.id,
        'nome': crianca.nome,
        'data_nascimento': crianca.data_nascimento.isoformat() if crianca.data_nascimento else None,
        'idade': crianca.idade(),
        'fora_da_faixa_etaria': crianca.fora_da_faixa_etaria(),
        'avatar': crianca.avatar,
        'etapa_atual_id': crianca.etapa_atual_id,
    }


def _responsavel_para_json(responsavel):
    return {
        'responsavel_id': responsavel.id,
        'nome': responsavel.nome,
        'email': responsavel.email,
        'criancas': [_crianca_para_json(crianca) for crianca in responsavel.criancas],
    }


@auth_bp.route('/auth/me', methods=['GET'])
@requer_autenticacao
def me():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    # O log exige uma criança; o acesso é da família, então registra a primeira cadastrada.
    registrar_log(
        acao='acesso_responsavel',
        responsavel_id=responsavel.id,
        crianca_id=responsavel.criancas[0].id,
    )
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
            dados.get('crianca_data_nascimento'),
            dados.get('crianca_avatar'),
        )
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400

    return jsonify(_responsavel_para_json(responsavel)), 201


@auth_bp.route('/criancas', methods=['POST'])
@requer_autenticacao
def adicionar_crianca():
    """Cadastra mais uma criança na conta do responsável autenticado."""
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    dados = request.get_json(silent=True) or {}
    try:
        crianca = auth_controller.adicionar_crianca(
            responsavel,
            dados.get('nome'),
            dados.get('data_nascimento'),
            dados.get('avatar'),
        )
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400

    return jsonify(_crianca_para_json(crianca)), 201
