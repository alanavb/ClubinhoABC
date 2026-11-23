# Rotas dos Termos de Uso, da Política de Privacidade e dos aceites
from flask import Blueprint, g, jsonify, request

from app.auth_utils import requer_autenticacao
from app.controllers import auth_controller, documentos_controller
from app.controllers.documentos_controller import AceiteInvalidoError

documentos_bp = Blueprint('documentos', __name__)


# Conversão do documento para JSON (com ou sem o texto)
def documento_para_json(documento, com_conteudo=True):
    dados = {
        'id': documento.id,
        'tipo': documento.tipo,
        'versao': documento.versao,
        'vigente_desde': documento.vigente_desde.isoformat(),
    }
    if com_conteudo:
        dados['conteudo'] = documento.conteudo
    return dados


@documentos_bp.route('/documentos', methods=['GET'])
# Rota pública: a tela de cadastro mostra os textos antes do login
def listar_documentos_vigentes():
    return jsonify([documento_para_json(documento) for documento in documentos_controller.documentos_vigentes()])


@documentos_bp.route('/aceites', methods=['POST'])
@requer_autenticacao
# Rota de aceite de uma versão nova
def aceitar_documentos():
    responsavel = auth_controller.buscar_por_supabase_id(g.supabase_user_id)
    if not responsavel:
        return jsonify({'erro': 'Cadastro ainda não concluído para este usuário.'}), 404

    dados = request.get_json(silent=True) or {}
    try:
        documentos_controller.aceitar_documentos(responsavel, dados.get('documentos'))
    except AceiteInvalidoError as erro:
        return jsonify({'erro': str(erro)}), 400
    return '', 204
