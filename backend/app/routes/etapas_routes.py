from flask import Blueprint, jsonify

from app.controllers import etapas_controller

etapas_bp = Blueprint('etapas', __name__)


@etapas_bp.route('/criancas/<int:crianca_id>/atividades', methods=['GET'])
def atividades_acessiveis(crianca_id):
    """RN1 — só devolve as atividades da etapa atual da criança."""
    try:
        crianca, atividades = etapas_controller.listar_atividades_acessiveis(crianca_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

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
def etapa_status(crianca_id, etapa_id):
    """RN3 — diz se a etapa está concluída (todas as obrigatórias feitas)."""
    try:
        status = etapas_controller.status_etapa(crianca_id, etapa_id)
    except ValueError as erro:
        return jsonify({'erro': str(erro)}), 404

    return jsonify(status)
