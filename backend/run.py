from app import create_app

# Criação da aplicação Flask
app = create_app()

# Inicialização do servidor local
if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], port=app.config['PORT'])
