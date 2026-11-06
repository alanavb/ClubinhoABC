from uuid import uuid4
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from .config import Config
from .limite_tentativas import ContadoresPorIp, verificar_limites

db = SQLAlchemy()

def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)

    # Limite de requisições e bloqueio de tentativas por IP, antes de qualquer rota.
    app.extensions['contadores_por_ip'] = ContadoresPorIp()
    app.before_request(verificar_limites)

    # 404 e 405 são erros do cliente, não falhas do servidor: têm resposta própria
    # e não podem cair no tratador de erro inesperado (500) logo abaixo.
    @app.errorhandler(404)
    def tratar_endereco_nao_encontrado(erro):
        return jsonify({'erro': 'Endereço não encontrado.'}), 404

    @app.errorhandler(405)
    def tratar_metodo_nao_permitido(erro):
        return jsonify({'erro': 'Método não permitido para este endereço.'}), 405

    @app.errorhandler(Exception)
    def tratar_erro_inesperado(erro):
        codigo_suporte = str(uuid4())
        app.logger.exception('Erro inesperado na API. Código de suporte: %s', codigo_suporte, exc_info=erro)
        if request.path.startswith('/api/'):
            return jsonify({
                'erro': 'Não foi possível concluir esta ação agora. Tente novamente em instantes.',
                'codigo': codigo_suporte,
            }), 500
        return 'Ocorreu um erro inesperado.', 500
    
    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ALLOWED_ORIGINS']}})

    from .routes.auth_routes import auth_bp
    from .routes.resultados_routes import resultados_bp
    from .routes.etapas_routes import etapas_bp
    from .routes.auditoria_routes import auditoria_bp
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(resultados_bp, url_prefix='/api')
    app.register_blueprint(etapas_bp, url_prefix='/api')
    app.register_blueprint(auditoria_bp, url_prefix='/api')

    return app
