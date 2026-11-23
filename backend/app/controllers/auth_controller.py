# Cadastro de famílias, crianças e conta do responsável

import datetime
import unicodedata

from app import db
from app.controllers.auditoria_controller import registrar_exclusao, registrar_log
from app.controllers.documentos_controller import registrar_aceites_do_cadastro
from app.models import Aceite, Crianca, Etapa, LogAuditoria, Responsavel, Resultado
from app.supabase_admin import excluir_usuario as excluir_usuario_supabase


# Erro de validação dos dados de cadastro
class DadosInvalidosError(Exception):
    pass


# Erro de criança duplicada na mesma conta
class CriancaDuplicadaError(DadosInvalidosError):
    pass


# Busca do responsável pelo id do Supabase
def buscar_por_supabase_id(supabase_user_id):
    return Responsavel.query.filter_by(supabase_user_id=supabase_user_id).first()


# Registro da sessão única ativa
def registrar_sessao_ativa(supabase_user_id, session_id):
    responsavel = buscar_por_supabase_id(supabase_user_id)
    if not responsavel:  # cadastro ainda não concluído
        return
    responsavel.sessao_ativa_id = session_id
    db.session.commit()


# Validação dos dados da criança
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


# Verificação de criança duplicada
def _crianca_ja_cadastrada(responsavel_id, nome, data_nascimento, ignorar_crianca_id=None):
    nome_normalizado = _normalizar_nome_para_comparacao(nome)
    criancas_da_conta = Crianca.query.filter_by(responsavel_id=responsavel_id).all()
    return any(
        crianca.id != ignorar_crianca_id
        and crianca.data_nascimento == data_nascimento
        and _normalizar_nome_para_comparacao(crianca.nome) == nome_normalizado
        for crianca in criancas_da_conta
    )


# Normalização de nome para comparação
def _normalizar_nome_para_comparacao(nome):
    nome_sem_acentos = ''.join(
        caractere
        for caractere in unicodedata.normalize('NFD', nome)
        if unicodedata.category(caractere) != 'Mn'
    )
    return ' '.join(nome_sem_acentos.split()).casefold()


# Consulta da primeira etapa da trilha
def _etapa_inicial():
    etapa = Etapa.query.order_by(Etapa.ordem).first()
    if not etapa:
        raise DadosInvalidosError('Nenhuma etapa cadastrada no sistema ainda. Rode o seeds.py primeiro.')
    return etapa


# Conclusão do cadastro da família
def completar_cadastro(supabase_user_id, email, nome, crianca_nome, crianca_data_nascimento, crianca_avatar=None,
                       documentos_aceitos=None):
    existente = buscar_por_supabase_id(supabase_user_id)
    if existente:
        return existente

    nome = (nome or '').strip()
    if not nome:
        raise DadosInvalidosError('Preencha o nome do responsável.')
    # Mantém compatibilidade com cadastros antigos
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
    # aceite dos termos marcado na tela de cadastro
    registrar_aceites_do_cadastro(responsavel, documentos_aceitos)
    db.session.commit()

    registrar_log(
        acao='cadastro_responsavel',
        responsavel_id=responsavel.id,
        crianca_id=crianca.id,
    )

    return responsavel


# Inclusão de uma criança no perfil
def adicionar_crianca(responsavel, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
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

# Busca de criança vinculada ao responsável
def buscar_crianca(responsavel,crianca_id): 
    crianca = Crianca.query.get(crianca_id)
    if not crianca or crianca.responsavel_id != responsavel.id:
        raise ValueError('Criança não encontrada')
    
    return crianca

# Atualização dos dados da criança
def editar_crianca(responsavel, crianca_id, crianca_nome, crianca_data_nascimento, crianca_avatar=None):
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


# Exclusão confirmada de uma criança
def excluir_crianca(responsavel, crianca_id, confirmacao):
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

    # Exclui dependências antes da conta
    Resultado.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    LogAuditoria.query.filter_by(crianca_id=crianca.id).delete(synchronize_session=False)
    db.session.delete(crianca)
    registrar_exclusao('crianca_excluida')
    db.session.commit()


# Exclusão confirmada da conta familiar
def excluir_conta(responsavel, confirmacao):
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

        Aceite.query.filter_by(responsavel_id=responsavel.id).delete(synchronize_session=False)
        db.session.delete(responsavel)
        registrar_exclusao('conta_excluida')
        # Confirma o banco antes de excluir no Supabase
        db.session.flush()
        excluir_usuario_supabase(responsavel.supabase_user_id)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
