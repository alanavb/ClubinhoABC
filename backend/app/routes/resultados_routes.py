from flask import Blueprint, jsonify, request

from app.controllers import resultados_controller
from app.controllers.etapas_controller import AcessoNegadoError

resultados_bp = Blueprint('resultados', __name__)

CAMPOS_OBRIGATORIOS = ['crianca_id', 'atividade_id', 'resposta_enviada', 'resposta_esperada']


@resultados_bp.route('/resultados', methods=['POST'])
def criar_resultado():
    dados = request.get_json(silent=True) or {}

    faltando = [campo for campo in CAMPOS_OBRIGATORIOS if campo not in dados]
    if faltando:
        return jsonify({'erro': f'Campos obrigatórios ausentes: {", ".join(faltando)}'}), 400

    try:
        resultado = resultados_controller.registrar_resultado(
            dados['crianca_id'],
            dados['atividade_id'],
            dados['resposta_enviada'],
            dados['resposta_esperada'],
        )
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404
    except AcessoNegadoError as erro:
        return jsonify({'erro': str(erro)}), 403

    return jsonify(resultado.to_dict()), 201


@resultados_bp.route('/resultados', methods=['GET'])
def listar_resultados():
    crianca_id = request.args.get('crianca_id', type=int)
    atividade_id = request.args.get('atividade_id', type=int)

    resultados = resultados_controller.listar_resultados(crianca_id, atividade_id)
    return jsonify([resultado.to_dict() for resultado in resultados])
