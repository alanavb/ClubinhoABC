"""Proteção contra força bruta e excesso de requisições, por endereço IP.

Duas regras, com os limites definidos em config.py:
- Excesso de requisições: mais de LIMITE_REQUISICOES_POR_MINUTO pedidos do mesmo
  IP em 1 minuto recebem 429 até o minuto passar.
- Bloqueio de tentativas: LIMITE_FALHAS_AUTENTICACAO falhas de autenticação
  (token ausente ou inválido) dentro de JANELA_FALHAS_SEGUNDOS bloqueiam o IP por
  TEMPO_BLOQUEIO_SEGUNDOS. Uma autenticação bem-sucedida zera as falhas.

A resposta é sempre a mesma mensagem genérica, sem dizer qual regra foi atingida.
Os contadores ficam na memória do servidor e são zerados quando ele reinicia, o
que é suficiente para um único servidor Flask, como o projeto roda hoje.
"""

import time

from flask import current_app, request

from app.error_responses import MENSAGEM_MUITAS_TENTATIVAS, erro_publico


class ContadoresPorIp:
    """Guarda, para cada IP, os horários das requisições e das falhas recentes."""

    def __init__(self):
        self.requisicoes = {}  # ip -> horários das requisições do último minuto
        self.falhas = {}  # ip -> horários das falhas de autenticação recentes
        self.bloqueado_ate = {}  # ip -> horário em que o bloqueio termina


def _agora():
    return time.time()


def _contadores():
    return current_app.extensions['contadores_por_ip']


def _resposta_de_espera(segundos):
    resposta, status = erro_publico(MENSAGEM_MUITAS_TENTATIVAS, 429)
    resposta.headers['Retry-After'] = str(int(segundos) + 1)
    return resposta, status


def verificar_limites():
    """Executada antes de cada requisição da API (before_request)."""
    # OPTIONS é a consulta automática de CORS feita pelo navegador, não um pedido da pessoa.
    if request.method == 'OPTIONS' or not request.path.startswith('/api/'):
        return None

    contadores, ip, agora = _contadores(), request.remote_addr, _agora()

    bloqueio = contadores.bloqueado_ate.get(ip, 0)
    if agora < bloqueio:
        return _resposta_de_espera(bloqueio - agora)

    recentes = [horario for horario in contadores.requisicoes.get(ip, []) if agora - horario < 60]
    recentes.append(agora)
    contadores.requisicoes[ip] = recentes
    if len(recentes) > current_app.config['LIMITE_REQUISICOES_POR_MINUTO']:
        return _resposta_de_espera(60 - (agora - recentes[0]))

    return None


def registrar_falha_de_autenticacao():
    contadores, ip, agora = _contadores(), request.remote_addr, _agora()
    config = current_app.config

    falhas = [horario for horario in contadores.falhas.get(ip, []) if agora - horario < config['JANELA_FALHAS_SEGUNDOS']]
    falhas.append(agora)
    contadores.falhas[ip] = falhas

    if len(falhas) >= config['LIMITE_FALHAS_AUTENTICACAO']:
        contadores.bloqueado_ate[ip] = agora + config['TEMPO_BLOQUEIO_SEGUNDOS']
        contadores.falhas[ip] = []


def limpar_falhas_de_autenticacao():
    _contadores().falhas.pop(request.remote_addr, None)
