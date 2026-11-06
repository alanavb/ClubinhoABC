from flask import jsonify

MENSAGEM_ACESSO_NEGADO = 'Você não tem permissão para realizar esta ação.'
MENSAGEM_SESSAO_INVALIDA = 'Não foi possível validar sua sessão. Entre novamente.'
MENSAGEM_MUITAS_TENTATIVAS = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'

def erro_publico(mensagem, status):
    return jsonify({'erro': mensagem}), status
