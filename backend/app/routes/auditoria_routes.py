from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller
from app.controllers.auditoria_controller import listar_logs
from app.models import Crianca

auditoria_bp =  Blueprint('auditoria',__name__)

@auditoria_bp.route('/logs', methods=['GET'])
@requer_autenticacao
def logs():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    crianca_id = request.args.get('crianca_id', type=int)
    if crianca_id:
        crianca = Crianca.query.get(crianca_id)
        if not crianca or crianca.responsavel_id != responsavel.id:
            return jsonify({'erro': 'Esta criança não pertence ao responsável autenticado.'}), 403

    registros = listar_logs(responsavel_id=responsavel.id, crianca_id=crianca_id)
    return jsonify([registro.to_dict() for registro in registros])

    
