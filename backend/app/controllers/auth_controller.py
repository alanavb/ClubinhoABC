"""RN — Login e controle de acesso: perfil do responsável (autenticação em si é do Supabase Auth)."""

from app import db
from app.controllers.auditoria_controller import registrar_log
from app.models import Crianca, Etapa, Responsavel


class DadosInvalidosError(Exception):
    """Campos obrigatórios ausentes para concluir o cadastro."""


def buscar_por_supabase_id(supabase_user_id):
    return Responsavel.query.filter_by(supabase_user_id=supabase_user_id).first()


def completar_cadastro(supabase_user_id, email, nome, crianca_nome, crianca_idade, crianca_avatar=None):
    """Cria o perfil local (responsável + criança) depois que o Supabase confirmou o e-mail.

    Idempotente: se o perfil já existir para esse usuário, só devolve o que já existe
    (evita duplicar caso o front chame de novo, ex.: duas abas confirmando ao mesmo tempo).
    """
    existente = buscar_por_supabase_id(supabase_user_id)
    if existente:
        return existente

    nome = (nome or '').strip()
    crianca_nome = (crianca_nome or '').strip()
    if not nome or not crianca_nome or crianca_idade is None:
        raise DadosInvalidosError('Preencha nome do responsável, nome e idade da criança.')

    etapa_inicial = Etapa.query.order_by(Etapa.ordem).first()
    if not etapa_inicial:
        raise DadosInvalidosError('Nenhuma etapa cadastrada no sistema ainda. Rode o seeds.py primeiro.')

    responsavel = Responsavel(supabase_user_id=supabase_user_id, nome=nome, email=email)
    db.session.add(responsavel)
    db.session.flush()  # garante responsavel.id antes de criar a criança

    crianca = Crianca(
        responsavel_id=responsavel.id,
        nome=crianca_nome,
        idade=crianca_idade,
        avatar=crianca_avatar,
        etapa_atual_id=etapa_inicial.id,
    )
    db.session.add(crianca)
    db.session.commit()

    registrar_log(
        acao='cadastro_responsavel',
        responsavel_id=responsavel.id,
        crianca_id=crianca.id,
        detalhes=f'responsavel={responsavel.email} crianca={crianca.nome}',
    )

    return responsavel
