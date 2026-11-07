"""Operações administrativas do Supabase Auth executadas somente no servidor."""

from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from flask import current_app


class SupabaseAdminError(Exception):
    """A operação administrativa não pôde ser concluída com segurança."""


def excluir_usuario(user_id):
    supabase_url = (current_app.config.get('SUPABASE_URL') or '').rstrip('/')
    secret_key = current_app.config.get('SUPABASE_SECRET_KEY')
    if not supabase_url or not secret_key:
        raise SupabaseAdminError('Exclusão administrativa não configurada.')

    requisicao = Request(
        f'{supabase_url}/auth/v1/admin/users/{quote(user_id, safe="")}',
        method='DELETE',
        headers={
            'apikey': secret_key,
            'Authorization': f'Bearer {secret_key}',
        },
    )
    try:
        with urlopen(requisicao, timeout=10) as resposta:
            if resposta.status not in (200, 204):
                raise SupabaseAdminError('O Supabase recusou a exclusão da conta.')
    except HTTPError as erro:
        # Se o usuário já não existe no Auth, a limpeza dos dados locais ainda
        # deve ser concluída para que a operação seja repetível com segurança.
        if erro.code != 404:
            raise SupabaseAdminError('O Supabase recusou a exclusão da conta.') from erro
    except (URLError, TimeoutError) as erro:
        raise SupabaseAdminError('Não foi possível contatar o Supabase.') from erro
