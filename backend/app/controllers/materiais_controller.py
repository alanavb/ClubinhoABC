from app.models import Material, ReferenciaMaterial


def listar_materiais_publicados():
    #Separa o material em destaque do catálogo visível, preservando a ordem.
    materiais = Material.query.filter_by(publicado=True).order_by(Material.ordem).all()
    destaque = next((material for material in materiais if material.destaque), None)
    catalogo = [material for material in materiais if not material.destaque]
    categorias = ['Todas']
    for material in catalogo:
        if material.categoria not in categorias:
            categorias.append(material.categoria)
    referencia = ReferenciaMaterial.query.filter_by(ativa=True).first()
    return destaque, catalogo, categorias, referencia
