from flask import Blueprint, jsonify

from app.auth_utils import requer_autenticacao
from app.controllers import materiais_controller


materiais_bp = Blueprint('materiais', __name__)


def _material_para_json(material):
    if not material:
        return None
    return {
        'id': material.chave,
        'titulo': material.titulo,
        'eixo': material.eixo,
        'descricao': material.descricao,
        'arquivo': material.arquivo,
        'paginas': material.paginas,
        'icone': material.icone,
        'tom': material.tom,
        'categoria': material.categoria,
    }


@materiais_bp.route('/materiais', methods=['GET'])
@requer_autenticacao
def listar_materiais():
    destaque, catalogo, categorias, referencia = materiais_controller.listar_materiais_publicados()
    return jsonify({
        'kitDaSemana': _material_para_json(destaque),
        'materiais': [_material_para_json(material) for material in catalogo],
        'categorias': categorias,
        'referencia': ({
            'titulo': referencia.titulo,
            'veiculo': referencia.veiculo,
            'url': referencia.url,
        } if referencia else None),
    })
