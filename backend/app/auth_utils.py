"""Login e controle de acesso — verificação do JWT emitido pelo Supabase Auth.

O Supabase (não o nosso back-end) autentica o responsável, faz o hash da
senha e envia os e-mails de confirmação/recuperação. Aqui só conferimos se
o token que chegou no header Authorization foi realmente emitido por ele e
não expirou, usando a chave pública publicada no endereço JWKS do projeto.
"""

from functools import lru_cache, wraps

import jwt
from flask import current_app, g, jsonify, request


class TokenInvalidoError(Exception):
    """Token ausente, expirado ou não emitido pelo Supabase deste projeto."""


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


def requer_autenticacao(funcao):
    """Exige um token válido do Supabase e disponibiliza os dados do usuário em `g`."""

    @wraps(funcao)
    def decorada(*args, **kwargs):
        cabecalho = request.headers.get('Authorization', '')
        if not cabecalho.startswith('Bearer '):
            return jsonify({'erro': 'Token de autenticação ausente.'}), 401

        try:
            claims = _decodificar_token(cabecalho.removeprefix('Bearer ').strip())
        except TokenInvalidoError as erro:
            return jsonify({'erro': f'Token inválido: {erro}'}), 401

        g.supabase_user_id = claims['sub']
        g.supabase_email = claims.get('email')
        g.supabase_user_metadata = claims.get('user_metadata', {})
        return funcao(*args, **kwargs)

    return decorada
