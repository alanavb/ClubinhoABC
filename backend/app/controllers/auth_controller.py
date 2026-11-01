"""RN — Login e controle de acesso: perfil do responsável (autenticação em si é do Supabase Auth)."""

import datetime
import unicodedata

from app import db
from app.controllers.auditoria_controller import registrar_log
from app.models import Crianca, Etapa, LogAuditoria, Responsavel, Resultado


class DadosInvalidosError(Exception):
    """Campos obrigatórios ausentes para concluir o cadastro."""


class CriancaDuplicadaError(DadosInvalidosError):
    """A conta já possui uma criança com o mesmo nome e data de nascimento."""


def buscar_por_supabase_id(supabase_user_id):
    return Responsavel.query.filter_by(supabase_user_id=supabase_user_id).first()


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
    """Evita duplicidade acidental na mesma conta, sem usar o avatar como identidade."""
    nome_normalizado = _normalizar_nome_para_comparacao(nome)
    criancas_da_conta = Crianca.query.filter_by(responsavel_id=responsavel_id).all()
    return any(
        crianca.id != ignorar_crianca_id
        and crianca.data_nascimento == data_nascimento
        and _normalizar_nome_para_comparacao(crianca.nome) == nome_normalizado
        for crianca in criancas_da_conta
    )


def _normalizar_nome_para_comparacao(nome):
    """Compara nomes sem diferenciar espaços, maiúsculas ou acentos."""
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
    """Cria o perfil local (responsável + primeira criança) depois que o Supabase confirmou o e-mail.

    Idempotente: se o perfil já existir para esse usuário, só devolve o que já existe
    (evita duplicar caso o front chame de novo, ex.: duas abas confirmando ao mesmo tempo).
    """
    existente = buscar_por_supabase_id(supabase_user_id)
    if existente:
        return existente

    nome = (nome or '').strip()
    if not nome:
        raise DadosInvalidosError('Preencha o nome do responsável.')
    # Contas criadas antes da data de nascimento só têm a idade nos dados do Supabase:
    # concluem o cadastro sem data (como as crianças antigas) em vez de ficarem presas.
    crianca_nome, data_nascimento = _validar_crianca(crianca_nome, crianca_data_nascimento, data_obrigatoria=False)
    etapa_inicial = _etapa_inicial()

    responsavel = Responsavel(supabase_user_id=supabase_user_id, nome=nome, email=email)
    db.session.add(responsavel)
    db.session.flush()  # garante responsavel.id antes de criar a criança

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
        detalhes=f'responsavel={responsavel.email} crianca={crianca.nome}',
    )

    return responsavel


def adicionar_crianca(responsavel, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
    """Vincula mais uma criança a um responsável já cadastrado (RF01: um responsável, várias crianças)."""
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
        detalhes=f'crianca={crianca.nome}',
    )

    return crianca

def buscar_crianca(responsavel,crianca_id): 
    """Devolve uma criança vinculada a responsável autenticado (404 se não for dele)."""
    crianca = Crianca.query.get(crianca_id)
    if not crianca or crianca.responsavel_id != responsavel.id:
        raise ValueError('Criança nãoo encontrada')
    
    return crianca

def editar_crianca(responsavel, crianca_id, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
    """Atualiza os dados de uma criança vinculada ao responsável autenticado."""
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
        detalhes=f'crianca={crianca.nome}',
    )

    return crianca


def excluir_crianca(responsavel, crianca_id, confirmacao):
    """Exclui definitivamente uma criança e os dados de aprendizagem vinculados."""
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

    # As tabelas usam chaves estrangeiras para a criança; removemos primeiro
    # os dados vinculados para que nenhum resultado ou registro fique órfão.
    Resultado.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    LogAuditoria.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    db.session.delete(crianca)
    db.session.commit()
