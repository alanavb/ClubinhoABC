from flask import Blueprint, jsonify, request
from app.controllers.auditoria_controller import listar_logs

auditoria_bp =  Blueprint('auditoria',__name__)

@auditoria_bp.route('/logs', methods=['GET'])
def logs ():
    responsavel_id = request.args.get('responsavel_id', type=int)
    crianca_id = request.args.get('crianca_id', type=int)
    registros = listar_logs(responsavel_id=responsavel_id, crianca_id=crianca_id)
    return jsonify([registro.to_dict() for registro in registros])

    
