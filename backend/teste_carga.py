"""Teste de carga: quantos usuários a API atende ao mesmo tempo dentro do RNF08 (até 3 s).

Cada usuário simulado repete o que o front faz ao abrir a aba Progresso:
GET /auth/me, GET /criancas/<id>/progresso e GET /criancas/<id>/dashboard.

Modo local (padrão): sobe a API numa porta livre, com SQLite temporário e o token
do Supabase simulado, como nos testes de integração. Mede o nosso código sem a rede.
    python teste_carga.py

Modo publicado: usa o token de uma conta de teste (copiado do navegador) e o id da criança.
    python teste_carga.py --url https://clubinhoabc.onrender.com/api --token <token> --crianca <id>
Atenção: no publicado vale o limite de 120 requisições por minuto por IP, então os
pedidos acima disso voltam com 429 (é a proteção funcionando, não falha do servidor).
"""

import argparse
import datetime
import logging
import os
import statistics
import tempfile
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

# Limite de tempo definido pelo requisito não funcional RNF08
LIMITE_RNF08 = 3.0  # segundos


# Envio de uma requisição e medição do tempo de resposta
def requisitar(url, token):
    pedido = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    inicio = time.perf_counter()
    try:
        with urllib.request.urlopen(pedido, timeout=30) as resposta:
            resposta.read()
            status = resposta.status
    except urllib.error.HTTPError as erro:
        status = erro.code
    except (urllib.error.URLError, TimeoutError):
        status = 0  # Sem resposta do servidor
    return time.perf_counter() - inicio, status


# Simulação das requisições feitas por uma pessoa na aba Progresso
def usuario(base, token, crianca_id, rodadas):
    medicoes = []
    for _ in range(rodadas):
        for caminho in ('/auth/me', f'/criancas/{crianca_id}/progresso', f'/criancas/{crianca_id}/dashboard'):
            medicoes.append(requisitar(base + caminho, token))
    return medicoes


# Execução de um nível de usuários simultâneos e cálculo das métricas
def rodar_nivel(base, token, crianca_id, usuarios, rodadas):
    inicio = time.perf_counter()
    with ThreadPoolExecutor(max_workers=usuarios) as executor:
        tarefas = [executor.submit(usuario, base, token, crianca_id, rodadas) for _ in range(usuarios)]
        medicoes = [medicao for tarefa in tarefas for medicao in tarefa.result()]
    duracao = time.perf_counter() - inicio

    tempos = sorted(tempo for tempo, status in medicoes if status == 200)
    contagem = {}
    for _, status in medicoes:
        contagem[status] = contagem.get(status, 0) + 1
    p95 = tempos[int(len(tempos) * 0.95) - 1] if tempos else 0
    return {
        'usuarios': usuarios,
        'requisicoes': len(medicoes),
        'ok': contagem.get(200, 0),
        'outros': {status: total for status, total in contagem.items() if status != 200},
        'media': statistics.mean(tempos) if tempos else 0,
        'p95': p95,
        'por_segundo': len(medicoes) / duracao,
    }


# Inicialização local da API com banco e token temporários
def subir_api_local():
    """API real numa porta livre, banco SQLite temporário e token simulado."""
    from unittest.mock import patch
    from werkzeug.serving import make_server

    # Oculta um registro de log para cada requisição simulada
    logging.getLogger('werkzeug').setLevel(logging.ERROR)

    # Criação do banco temporário usado no teste local
    pasta = tempfile.mkdtemp()
    os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(pasta, "carga.db")}'

    from app import create_app, db
    from app.models import Atividade, Crianca, Etapa, Responsavel, Resultado

    app = create_app({
        'SQLALCHEMY_DATABASE_URI': os.environ['DATABASE_URL'],
        'SUPABASE_JWKS_URL': 'https://nao-usado.local/jwks',
        # Evita que o limite por IP interrompa os usuários simulados
        'LIMITE_REQUISICOES_POR_MINUTO': 10 ** 9,
    })
    with app.app_context():
        db.create_all()
        responsavel = Responsavel(supabase_user_id='carga', nome='Carga', email='carga@teste.local')
        db.session.add(responsavel)
        db.session.flush()
        etapas = []
        for ordem, chave in enumerate(['caca-as-letras', 'monte-a-palavra', 'ouca-e-escolha', 'leia-e-descubra'], 1):
            etapa = Etapa(chave=chave, nome=chave, ordem=ordem)
            db.session.add(etapa)
            db.session.flush()
            etapas.append(etapa)
            for numero in range(4):
                db.session.add(Atividade(etapa_id=etapa.id, chave=f'{chave}-{numero}', nome=f'Atividade {numero}',
                                         ordem=numero + 1, obrigatoria=numero < 3))
        crianca = Crianca(responsavel_id=responsavel.id, nome='Bia', data_nascimento=datetime.date(2019, 5, 10),
                          etapa_atual_id=etapas[1].id)
        db.session.add(crianca)
        db.session.flush()
        # Histórico semelhante ao de uma criança que já realizou atividades
        for indice, atividade in enumerate(Atividade.query.all() * 5):
            db.session.add(Resultado(crianca_id=crianca.id, atividade_id=atividade.id, resposta='x',
                                     correta=indice % 3 != 0))
        db.session.commit()
        crianca_id = crianca.id

    # Simulação da validação externa do token do Supabase
    patch('app.auth_utils._decodificar_token', return_value={'sub': 'carga', 'email': 'carga@teste.local'}).start()
    servidor = make_server('127.0.0.1', 0, app, threaded=True)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{servidor.server_port}/api', 'token-simulado', crianca_id


# Configuração e execução do teste de carga
def main():
    # Argumentos disponíveis no terminal
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--url', help='endereço da API publicada (ex.: https://clubinhoabc.onrender.com/api)')
    parser.add_argument('--token', help='token de acesso de uma conta de teste')
    parser.add_argument('--crianca', type=int, help='id de uma criança dessa conta')
    parser.add_argument('--usuarios', default='1,10,25,50,100,150,200', help='níveis de usuários simultâneos')
    parser.add_argument('--rodadas', type=int, default=3, help='quantas vezes cada usuário abre a aba Progresso')
    args = parser.parse_args()

    # Definição do ambiente publicado ou do ambiente local temporário
    if args.url:
        if not (args.token and args.crianca):
            parser.error('no modo publicado, informe também --token e --crianca')
        base, token, crianca_id = args.url.rstrip('/'), args.token, args.crianca
        print(f'Modo publicado: {base}')
    else:
        base, token, crianca_id = subir_api_local()
        print('Modo local: API do projeto com banco SQLite temporário')

    # Exibição das métricas por nível de usuários simultâneos
    print(f'Cada usuário faz {args.rodadas * 3} requisições (/auth/me, /progresso, /dashboard).\n')
    print(f'{"usuários":>8} | {"requisições":>11} | {"ok":>5} | {"média":>8} | {"p95":>8} | {"req/s":>6} | outros status')
    resultados = []
    for usuarios in [int(valor) for valor in args.usuarios.split(',')]:
        r = rodar_nivel(base, token, crianca_id, usuarios, args.rodadas)
        resultados.append(r)
        outros = ', '.join(f'{status or "sem resposta"}: {total}' for status, total in r['outros'].items()) or '-'
        print(f'{r["usuarios"]:>8} | {r["requisicoes"]:>11} | {r["ok"]:>5} | {r["media"] * 1000:>6.0f}ms | '
              f'{r["p95"] * 1000:>6.0f}ms | {r["por_segundo"]:>6.1f} | {outros}')

    # Identificação do maior nível que atende ao RNF08
    dentro = [r['usuarios'] for r in resultados if r['p95'] <= LIMITE_RNF08 and not r['outros']]
    print()
    if dentro:
        print(f'Maior nível dentro do RNF08 (95% das respostas em até {LIMITE_RNF08:.0f} s e sem erros): '
              f'{max(dentro)} usuários simultâneos.')
    else:
        print('Nenhum nível ficou dentro do RNF08.')


if __name__ == '__main__':
    main()
