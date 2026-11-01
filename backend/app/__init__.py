from uuid import uuid4
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from .config import Config

db = SQLAlchemy()

def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)

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
