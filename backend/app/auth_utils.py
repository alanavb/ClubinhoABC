from functools import lru_cache, wraps
import jwt
from flask import current_app, g, jsonify, request
from app.error_responses import MENSAGEM_SESSAO_ENCERRADA, MENSAGEM_SESSAO_INVALIDA, erro_publico
from app.limite_tentativas import limpar_falhas_de_autenticacao, registrar_falha_de_autenticacao
from app.models import Responsavel


class TokenInvalidoError(Exception):
   pass
@lru_cache(maxsize=1)
def _cliente_jwks(jwks_url):
    return jwt.PyJWKClient(jwks_url)


def _decodificar_token(token):
    jwks_url = current_app.config['SUPABASE_JWKS_URL']
    if not jwks_url:
        raise TokenInvalidoError('SUPABASE_JWKS_URL não configurada no back-end.')

    try:
        chave_assinatura = _cliente_jwks(jwks_url).get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            chave_assinatura.key,
            algorithms=['ES256', 'RS256'],
            audience='authenticated',
        )
    except jwt.PyJWTError as erro:
        raise TokenInvalidoError(str(erro)) from erro


def _sessao_foi_substituida(claims):
    responsavel = Responsavel.query.filter_by(supabase_user_id=claims['sub']).first()
    return bool(responsavel and responsavel.sessao_ativa_id
                and claims.get('session_id') != responsavel.sessao_ativa_id)


def _autenticar(funcao, verificar_sessao):
    @wraps(funcao)
    def decorada(*args, **kwargs):
        cabecalho = request.headers.get('Authorization', '')
        if not cabecalho.startswith('Bearer '):
            registrar_falha_de_autenticacao()
            return jsonify({'erro': 'Token de autenticação ausente.'}), 401

        try:
            claims = _decodificar_token(cabecalho.removeprefix('Bearer ').strip())
        except TokenInvalidoError:
            registrar_falha_de_autenticacao()
            return erro_publico(MENSAGEM_SESSAO_INVALIDA, 401)

        limpar_falhas_de_autenticacao()

        # sessão antiga não é ataque: não conta como falha de login
        if verificar_sessao and _sessao_foi_substituida(claims):
            return jsonify({'erro': MENSAGEM_SESSAO_ENCERRADA, 'codigo': 'sessao_encerrada'}), 401

        g.supabase_user_id = claims['sub']
        g.supabase_email = claims.get('email')
        g.supabase_user_metadata = claims.get('user_metadata', {})
        g.supabase_session_id = claims.get('session_id')
        return funcao(*args, **kwargs)

    return decorada


def requer_autenticacao(funcao):
    return _autenticar(funcao, verificar_sessao=True)


def requer_autenticacao_de_novo_login(funcao):
    """Só para POST /auth/sessao: o token do login novo ainda não está registrado."""
    return _autenticar(funcao, verificar_sessao=False)
