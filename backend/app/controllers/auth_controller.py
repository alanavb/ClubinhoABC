"""Cadastro, crianças e conta do responsável. Senha e e-mail ficam no Supabase Auth."""

import datetime
import unicodedata

from app import db
from app.controllers.auditoria_controller import registrar_exclusao, registrar_log
from app.models import Crianca, Etapa, LogAuditoria, Responsavel, Resultado
from app.supabase_admin import excluir_usuario as excluir_usuario_supabase


class DadosInvalidosError(Exception):
    """Dados de cadastro faltando ou inválidos."""


class CriancaDuplicadaError(DadosInvalidosError):
    """A conta já possui uma criança com o mesmo nome e data de nascimento."""


def buscar_por_supabase_id(supabase_user_id):
    return Responsavel.query.filter_by(supabase_user_id=supabase_user_id).first()


def registrar_sessao_ativa(supabase_user_id, session_id):
    """Sessão única: só o último login vale."""
    responsavel = buscar_por_supabase_id(supabase_user_id)
    if not responsavel:  # cadastro ainda não concluído
        return
    responsavel.sessao_ativa_id = session_id
    db.session.commit()


def _validar_crianca(crianca_nome, crianca_data_nascimento, data_obrigatoria=True):
    crianca_nome = ' '.join((crianca_nome or '').split())
    if not crianca_nome:
        raise DadosInvalidosError('Preencha o nome e a data de nascimento da criança.')
    if not crianca_data_nascimento:
        if data_obrigatoria:
            raise DadosInvalidosError('Preencha o nome e a data de nascimento da criança.')
        return crianca_nome, None
    try:
        data_nascimento = datetime.date.fromisoformat(str(crianca_data_nascimento))
    except ValueError:
        raise DadosInvalidosError('Data de nascimento inválida. Use o formato AAAA-MM-DD.') from None
    if data_nascimento > datetime.date.today():
        raise DadosInvalidosError('A data de nascimento não pode estar no futuro.')
    return crianca_nome, data_nascimento


def _crianca_ja_cadastrada(responsavel_id, nome, data_nascimento, ignorar_crianca_id=None):
    """O avatar não entra: trocar o bichinho não faz outra criança."""
    nome_normalizado = _normalizar_nome_para_comparacao(nome)
    criancas_da_conta = Crianca.query.filter_by(responsavel_id=responsavel_id).all()
    return any(
        crianca.id != ignorar_crianca_id
        and crianca.data_nascimento == data_nascimento
        and _normalizar_nome_para_comparacao(crianca.nome) == nome_normalizado
        for crianca in criancas_da_conta
    )


def _normalizar_nome_para_comparacao(nome):
    """Ignora espaços, maiúsculas e acentos."""
    nome_sem_acentos = ''.join(
        caractere
        for caractere in unicodedata.normalize('NFD', nome)
        if unicodedata.category(caractere) != 'Mn'
    )
    return ' '.join(nome_sem_acentos.split()).casefold()


def _etapa_inicial():
    etapa = Etapa.query.order_by(Etapa.ordem).first()
    if not etapa:
        raise DadosInvalidosError('Nenhuma etapa cadastrada no sistema ainda. Rode o seeds.py primeiro.')
    return etapa


def completar_cadastro(supabase_user_id, email, nome, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
    """Cria responsável + primeira criança no primeiro login após confirmar o e-mail.

    Idempotente: duas abas abertas ao mesmo tempo não duplicam o perfil.
    """
    existente = buscar_por_supabase_id(supabase_user_id)
    if existente:
        return existente

    nome = (nome or '').strip()
    if not nome:
        raise DadosInvalidosError('Preencha o nome do responsável.')
    # contas antigas só têm a idade no Supabase: aceita sem data para não travar o cadastro
    crianca_nome, data_nascimento = _validar_crianca(crianca_nome, crianca_data_nascimento, data_obrigatoria=False)
    etapa_inicial = _etapa_inicial()

    responsavel = Responsavel(supabase_user_id=supabase_user_id, nome=nome, email=email)
    db.session.add(responsavel)
    db.session.flush()  # a criança precisa do responsavel.id

    crianca = Crianca(
        responsavel_id=responsavel.id,
        nome=crianca_nome,
        data_nascimento=data_nascimento,
        avatar=crianca_avatar,
        etapa_atual_id=etapa_inicial.id,
    )
    db.session.add(crianca)
    db.session.commit()

    registrar_log(
        acao='cadastro_responsavel',
        responsavel_id=responsavel.id,
        crianca_id=crianca.id,
    )

    return responsavel


def adicionar_crianca(responsavel, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
    """RF01: um responsável, várias crianças."""
    crianca_nome, data_nascimento = _validar_crianca(crianca_nome, crianca_data_nascimento)
    if _crianca_ja_cadastrada(responsavel.id, crianca_nome, data_nascimento):
        raise CriancaDuplicadaError('Esta criança já está cadastrada nesta conta.')

    crianca = Crianca(
        responsavel_id=responsavel.id,
        nome=crianca_nome,
        data_nascimento=data_nascimento,
        avatar=crianca_avatar,
        etapa_atual_id=_etapa_inicial().id,
    )
    db.session.add(crianca)
    db.session.commit()

    registrar_log(
        acao='cadastro_crianca',
        responsavel_id=responsavel.id,
        crianca_id=crianca.id,
    )

    return crianca

def buscar_crianca(responsavel,crianca_id): 
    """Criança de outra família também dá 404, para não confirmar que o id existe."""
    crianca = Crianca.query.get(crianca_id)
    if not crianca or crianca.responsavel_id != responsavel.id:
        raise ValueError('Criança não encontrada')
    
    return crianca

def editar_crianca(responsavel, crianca_id, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
    """Mesmas validações do cadastro, inclusive a de criança duplicada."""
    crianca = Crianca.query.get(crianca_id)
    if not crianca or crianca.responsavel_id != responsavel.id:
        raise ValueError('Criança não encontrada')

    novo_nome, nova_data_nascimento = _validar_crianca(
        crianca_nome, crianca_data_nascimento
    )
    if _crianca_ja_cadastrada(
        responsavel.id, novo_nome, nova_data_nascimento, ignorar_crianca_id=crianca.id
    ):
        raise CriancaDuplicadaError('Esta criança já está cadastrada nesta conta.')
    crianca.nome = novo_nome
    crianca.data_nascimento = nova_data_nascimento
    crianca.avatar = crianca_avatar
    db.session.commit()

    registrar_log(
        acao='edicao_crianca',
        responsavel_id=responsavel.id,
        crianca_id=crianca.id,
    )

    return crianca


def excluir_crianca(responsavel, crianca_id, confirmacao):
    """Apaga a criança com os resultados e logs dela. Não tem volta."""
    crianca = Crianca.query.get(crianca_id)
    if not crianca or crianca.responsavel_id != responsavel.id:
        raise ValueError('Criança não encontrada')

    frase_esperada = f'EXCLUIR {crianca.nome}'
    confirmacao_normalizada = ' '.join((confirmacao or '').split())
    frase_normalizada = ' '.join(frase_esperada.split())
    if confirmacao_normalizada != frase_normalizada:
        raise DadosInvalidosError(
            f'Digite "{frase_esperada}" para confirmar a exclusão.'
        )

    # dependentes primeiro por causa das FKs
    Resultado.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    LogAuditoria.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    db.session.delete(crianca)
    registrar_exclusao('crianca_excluida')
    db.session.commit()


def excluir_conta(responsavel, confirmacao):
    """Apaga a família inteira no banco e o usuário no Supabase Auth."""
    if ' '.join((confirmacao or '').split()) != 'EXCLUIR MINHA CONTA':
        raise DadosInvalidosError(
            'Digite "EXCLUIR MINHA CONTA" para confirmar a exclusão.'
        )

    crianca_ids = [crianca.id for crianca in responsavel.criancas]
    try:
        if crianca_ids:
            Resultado.query.filter(Resultado.crianca_id.in_(crianca_ids)).delete(
                synchronize_session=False
            )
            LogAuditoria.query.filter(LogAuditoria.crianca_id.in_(crianca_ids)).delete(
                synchronize_session=False
            )
            for crianca in list(responsavel.criancas):
                db.session.delete(crianca)

        db.session.delete(responsavel)
        registrar_exclusao('conta_excluida')
        # flush antes do Supabase: se o banco recusar, o usuário no Auth fica intacto
        db.session.flush()
        excluir_usuario_supabase(responsavel.supabase_user_id)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
