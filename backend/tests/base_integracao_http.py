"""Base compartilhada dos testes de integração com HTTP real.

Sobe o Flask de verdade em uma porta aleatória (equivalente ao RANDOM_PORT do
Spring) e usa um banco SQLite em memória, novo a cada teste. Cada chamada dos
testes passa pela rede local: rota -> autenticação -> controller -> banco.

O único componente substituído é a validação do token do Supabase (serviço
externo): `_decodificar_token` devolve as claims do responsável de teste.
"""

import datetime
import threading
import unittest
import uuid
from unittest.mock import patch

import requests
from werkzeug.serving import make_server

from app import create_app, db
from app.models import Atividade, Etapa, Responsavel

TIMEOUT = 5  # segundos: evita teste pendurado se o servidor travar

class IntegracaoHttpBase(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',  # nunca o banco de desenvolvimento
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
       })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.addCleanup(self._descartar_banco)

        # Dados únicos por execução: nada depende de cadastro manual ou de outro teste.
        sufixo = uuid.uuid4().hex[:12]
        self.supabase_user_id = f'user-{sufixo}'
        self.email = f'responsavel-{sufixo}@teste.local'

        # Dados do jogo (o que o seeds.py cria) + o responsável autenticado.
        # O jogo é o mesmo para todos os testes, mas o responsável é único por execução.
        etapa = Etapa(chave=f'etapa-{sufixo}', nome='Caça às Letras', ordem=1)
        responsavel = Responsavel(
            supabase_user_id=self.supabase_user_id, nome='Ana', email=self.email
        )
        db.session.add_all([etapa, responsavel])
        db.session.flush()
        atividade = Atividade(etapa_id=etapa.id, chave=f'atividade-{sufixo}', nome='Ouça e ecolha', ordem='1')
        db.session.add(atividade)
        db.session.commit()
        self.etapa_id = etapa.id
        self.responsavel_id = responsavel.id
        self.atividade_id = atividade.id

        self._iniciar_servidor()
        self._simular_token_do_supabase()
     # ------------------------------------------------------------------ infraestrutura
    def _iniciar_servidor(self):
        self.servidor = make_server('127.0.0.1', 0, self.app, threaded=True) #porta 0 = aleatoria
        self.base_url = f'http://127.0.0.1:{self.servidor.server_port}'
        thread = threading.Thread(target=self.servidor.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self._parar_servidor, thread)

    def _parar_servidor(self, thread):
        self.servidor.shutdown()
        thread.join(timeout=TIMEOUT)
        self.servidor.server_close()

    def _simular_token_do_supabase(self):
       claims = {'sub': self.supabase_user_id, 'email': self.email}
       patcher = patch('app.auth_utils._decodificar_token', return_value=claims)
       patcher.start()
       self.addCleanup(patcher.stop)
    
    def _descartar_banco(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
    # ------------------------------------------------------------------ helpers de HTTP
    @property
    def auth(self):
        return {'Authorization': 'Bearer token-de-teste'}
    
    def get(self, caminho, **kwargs):
        return requests.get(self.base_url + caminho, headers=self.auth, timeout=TIMEOUT, **kwargs)

    def post(self, caminho, json=None):
        return requests.post(self.base_url + caminho, headers=self.auth, json=json, timeout=TIMEOUT)
    # ------------------------------------------------------------------ helpers de dados
    def montar_request_crianca(self, nome, data_nascimento=None, avatar='🦊'):
        # 1º de janeiro de 6 anos atrás: a idade é 6 em qualquer dia do ano.
        data_nascimento = data_nascimento or datetime.date(datetime.date.today().year - 6, 1, 1)
        return {'nome': nome, 'data_nascimento': data_nascimento.isoformat(), 'avatar': avatar}

    def criar_crianca(self, nome):
        """Cria a criança pelo endpoint real e devolve o JSON da resposta."""
        resposta = self.post('/api/criancas', json=self.montar_request_crianca(nome))
        self.assertEqual(201, resposta.status_code, resposta.text)
        return resposta.json()

    def criar_resultado(self, crianca_id, enviada, esperada):
        """Registra um resultado pelo endpoint real e devolve o JSON da resposta."""
        resposta = self.post('/api/resultados', json={
            'crianca_id': crianca_id,
            'atividade_id': self.atividade_id,
            'resposta_enviada': enviada,
            'resposta_esperada': esperada,
        })
        self.assertEqual(201, resposta.status_code, resposta.text)
        return resposta.json()