# Limites por IP para requisições e falhas de autenticação
# Contadores em memória são reiniciados com o servidor

import time
from flask import current_app, request
from app.error_responses import MENSAGEM_MUITAS_TENTATIVAS, erro_publico

# Contadores de requisições, falhas e bloqueios por IP
class ContadoresPorIp:

    def __init__(self):
        self.requisicoes = {}
        self.falhas = {}
        self.bloqueado_ate = {}


# Horário atual usado nos limites
def _agora():
    return time.time()


# Contadores registrados na aplicação Flask
def _contadores():
    return current_app.extensions['contadores_por_ip']


# Resposta 429 com tempo de espera
def _resposta_de_espera(segundos):
    resposta, status = erro_publico(MENSAGEM_MUITAS_TENTATIVAS, 429)
    resposta.headers['Retry-After'] = str(int(segundos) + 1)
    return resposta, status


# Verificação de limite de requisições por IP
def verificar_limites():
    # Ignora preflight CORS e rotas fora da API
    if request.method == 'OPTIONS' or not request.path.startswith('/api/'):
        return None

    contadores, ip, agora = _contadores(), request.remote_addr, _agora()

    # Bloqueio temporário após falhas de autenticação
    bloqueio = contadores.bloqueado_ate.get(ip, 0)
    if agora < bloqueio:
        return _resposta_de_espera(bloqueio - agora)

    # Janela de requisições do último minuto
    recentes = [horario for horario in contadores.requisicoes.get(ip, []) if agora - horario < 60]
    recentes.append(agora)
    contadores.requisicoes[ip] = recentes
    if len(recentes) > current_app.config['LIMITE_REQUISICOES_POR_MINUTO']:
        return _resposta_de_espera(60 - (agora - recentes[0]))

    return None


# Registro de falhas de autenticação por IP
def registrar_falha_de_autenticacao():
    contadores, ip, agora = _contadores(), request.remote_addr, _agora()
    config = current_app.config

    # Janela de falhas recentes do mesmo IP
    falhas = [horario for horario in contadores.falhas.get(ip, []) if agora - horario < config['JANELA_FALHAS_SEGUNDOS']]
    falhas.append(agora)
    contadores.falhas[ip] = falhas

    # Bloqueio ao atingir o limite de falhas
    if len(falhas) >= config['LIMITE_FALHAS_AUTENTICACAO']:
        contadores.bloqueado_ate[ip] = agora + config['TEMPO_BLOQUEIO_SEGUNDOS']
        contadores.falhas[ip] = []


# Limpeza de falhas após autenticação válida
def limpar_falhas_de_autenticacao():
    _contadores().falhas.pop(request.remote_addr, None)
