from app.models import Historia


def listar_historias_publicadas():
    #Retorna somente leituras disponíveis, na ordem pedagógica definida.
    return Historia.query.filter_by(publicada=True).order_by(Historia.ordem).all()
