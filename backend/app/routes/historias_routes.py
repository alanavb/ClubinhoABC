from flask import Blueprint, jsonify

from app.auth_utils import requer_autenticacao
from app.controllers import historias_controller


historias_bp = Blueprint('historias', __name__)


@historias_bp.route('/historias', methods=['GET'])
@requer_autenticacao

def listar_historias():
    historias = historias_controller.listar_historias_publicadas()
    return jsonify([
        {
            'id': historia.chave,
            'title': historia.titulo,
            'icon': historia.icone,
            'nivel': historia.nivel,
            'nivelClasse': historia.nivel_classe,
            'objetivo': historia.objetivo,
            'metodologia': historia.metodologia,
            'tag': historia.tag,
            'time': historia.tempo,
            'tema': historia.tema,
            'texto': historia.texto,
        }
        for historia in historias
    ])
