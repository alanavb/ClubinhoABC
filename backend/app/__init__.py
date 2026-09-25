from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from .config import Config

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    # Front-end (Vite, porta 5173) e back-end (porta 5000) rodam em origens
    # diferentes em desenvolvimento — libera só as rotas /api/* e só para o
    # front-end local, não para qualquer origem.
    CORS(app, resources={r'/api/*': {'origins': 'http://localhost:5173'}})

    from .routes.auth_routes import auth_bp
    from .routes.resultados_routes import resultados_bp
    from .routes.etapas_routes import etapas_bp
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(resultados_bp, url_prefix='/api')
    app.register_blueprint(etapas_bp, url_prefix='/api')

    return app
