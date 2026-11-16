from flask import Blueprint, g, jsonify, request, url_for

from app.auth_utils import requer_autenticacao, requer_autenticacao_de_novo_login
from app.controllers import auth_controller
from app.controllers.auditoria_controller import registrar_log
from app.controllers.auth_controller import DadosInvalidosError
from app.supabase_admin import SupabaseAdminError

auth_bp = Blueprint('auth', __name__)


# Conversão dos dados da criança para JSON
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


# Conversão dos dados do responsável para JSON
def _responsavel_para_json(responsavel):
    return {
        'responsavel_id': responsavel.id,
        'nome': responsavel.nome,
        'email': responsavel.email,
        'criancas': [_crianca_para_json(crianca) for crianca in responsavel.criancas],
    }


@auth_bp.route('/auth/sessao', methods=['POST'])
@requer_autenticacao_de_novo_login
# Rota de registro da sessão ativa
def registrar_sessao():
    auth_controller.registrar_sessao_ativa(g.supabase_user_id, g.supabase_session_id)
    return '', 204


@auth_bp.route('/auth/sessao', methods=['GET'])
@requer_autenticacao
# Rota de verificação da sessão ativa
def conferir_sessao():
    return '', 204


@auth_bp.route('/auth/me', methods=['GET'])
@requer_autenticacao
# Rota do perfil autenticado
def me():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    # o log exige uma criança; conta sem criança (depois de excluir todas) fica sem registro
    if responsavel.criancas:
        registrar_log(
            acao='acesso_responsavel',
            responsavel_id=responsavel.id,
            crianca_id=responsavel.criancas[0].id,
        )
    return jsonify(_responsavel_para_json(responsavel))


@auth_bp.route('/auth/completar-cadastro', methods=['POST'])
@requer_autenticacao
# Rota de conclusão de cadastro
def completar_cadastro():
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
# Rota de inclusão de criança
def adicionar_crianca():
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

    resposta = jsonify(_crianca_para_json(crianca))
    resposta.status_code = 201
    resposta.headers['Location'] =  url_for('auth.buscar_crianca', crianca_id=crianca.id)
    return resposta

@auth_bp.route('/criancas/<int:crianca_id>', methods=['GET'])
@requer_autenticacao
# Rota de consulta de criança
def buscar_crianca(crianca_id):
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    try:
        crianca = auth_controller.buscar_crianca(responsavel, crianca_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

    return jsonify(_crianca_para_json(crianca))

@auth_bp.route('/criancas/<int:crianca_id>', methods=['PUT'])
@requer_autenticacao
# Rota de atualização de criança
def editar_crianca(crianca_id):
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    dados = request.get_json(silent=True) or {}
    try:
        crianca = auth_controller.editar_crianca(
            responsavel,
            crianca_id,
            dados.get('nome'),
            dados.get('data_nascimento'),
            dados.get('avatar'),
        )
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

    return jsonify(_crianca_para_json(crianca))


@auth_bp.route('/criancas/<int:crianca_id>', methods=['DELETE'])
@requer_autenticacao
# Rota de exclusão de criança
def excluir_crianca(crianca_id):
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    dados = request.get_json(silent=True) or {}
    try:
        auth_controller.excluir_crianca(
            responsavel, crianca_id, dados.get('confirmacao')
        )
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

    return '', 204


@auth_bp.route('/auth/conta', methods=['DELETE'])
@requer_autenticacao
# Rota de exclusão da conta
def excluir_conta():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro não encontrado para este usuário.'}), 404

    dados = request.get_json(silent=True) or {}
    try:
        auth_controller.excluir_conta(responsavel, dados.get('confirmacao'))
    except DadosInvalidosError as erro:
        return jsonify({'erro': str(erro)}), 400
    except SupabaseAdminError:
        return jsonify({
            'erro': 'Não foi possível excluir a conta agora. Tente novamente em instantes.'
        }), 503

    return '', 204
