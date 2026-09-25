from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, resultados_controller
from app.controllers.etapas_controller import AcessoNegadoError

resultados_bp = Blueprint('resultados', __name__)

CAMPOS_OBRIGATORIOS = ['crianca_id', 'atividade_id', 'resposta_enviada', 'resposta_esperada']


def _responsavel_atual():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return None, (jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404)
    return responsavel.id, None


@resultados_bp.route('/resultados', methods=['POST'])
@requer_autenticacao
def criar_resultado():
    dados = request.get_json(silent=True) or {}

    faltando = [campo for campo in CAMPOS_OBRIGATORIOS if campo not in dados]
    if faltando:
        return jsonify({'erro': f'Campos obrigatórios ausentes: {", ".join(faltando)}'}), 400

    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        resultado = resultados_controller.registrar_resultado(
            dados['crianca_id'],
            dados['atividade_id'],
            dados['resposta_enviada'],
            dados['resposta_esperada'],
            responsavel_id=responsavel_id,
        )
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError as erro:
        return jsonify({'erro': str(erro)}), 403

    return jsonify(resultado.to_dict()), 201


@resultados_bp.route('/resultados', methods=['GET'])
@requer_autenticacao
def listar_resultados():
    crianca_id = request.args.get('crianca_id', type=int)
    atividade_id = request.args.get('atividade_id', type=int)

    responsavel_id, erro_resposta = _responsavel_atual()
    if erro_resposta:
        return erro_resposta

    try:
        resultados = resultados_controller.listar_resultados(
            crianca_id, atividade_id, responsavel_id=responsavel_id
        )
    except AcessoNegadoError as erro:
        return jsonify({'erro': str(erro)}), 403

    return jsonify([resultado.to_dict() for resultado in resultados])
