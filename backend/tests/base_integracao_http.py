# Base compartilhada dos testes de integração HTTP
# Usa servidor Flask e banco SQLite temporários

import datetime
import threading
import unittest
import uuid
from unittest.mock import patch

import requests
from werkzeug.serving import make_server

from app import create_app, db
from app.models import Atividade, Etapa, Responsavel

TIMEOUT = 5

# Classe base para testes de integração HTTP
class IntegracaoHttpBase(unittest.TestCase):

    # Preparação de servidor, banco e usuário autenticado
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
       })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.addCleanup(self._descartar_banco)

        # Identificação exclusiva do responsável do teste
        sufixo = uuid.uuid4().hex[:12]
        self.supabase_user_id = f'user-{sufixo}'
        self.email = f'responsavel-{sufixo}@teste.local'

        # Dados da trilha e do responsável autenticado
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
    # Inicialização do servidor temporário
    def _iniciar_servidor(self):
        self.servidor = make_server('127.0.0.1', 0, self.app, threaded=True)
        self.base_url = f'http://127.0.0.1:{self.servidor.server_port}'
        thread = threading.Thread(target=self.servidor.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self._parar_servidor, thread)

    # Encerramento do servidor temporário
    def _parar_servidor(self, thread):
        self.servidor.shutdown()
        thread.join(timeout=TIMEOUT)
        self.servidor.server_close()

    # Simulação da validação do token do Supabase
    def _simular_token_do_supabase(self):
        claims = {'sub': self.supabase_user_id, 'email': self.email}
        patcher = patch('app.auth_utils._decodificar_token', return_value=claims)
        patcher.start()
        self.addCleanup(patcher.stop)
    
    # Remoção do banco temporário
    def _descartar_banco(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
    # Cabeçalho de autenticação das requisições
    @property
    def auth(self):
        return {'Authorization': 'Bearer token-de-teste'}
    
    # Requisição GET autenticada
    def get(self, caminho, **kwargs):
        return requests.get(self.base_url + caminho, headers=self.auth, timeout=TIMEOUT, **kwargs)

    # Requisição POST autenticada
    def post(self, caminho, json=None):
        return requests.post(self.base_url + caminho, headers=self.auth, json=json, timeout=TIMEOUT)

    # Requisição PUT autenticada
    def put(self, caminho, json=None):
        return requests.put(self.base_url + caminho, headers=self.auth, json=json, timeout=TIMEOUT)

    # Requisição DELETE autenticada
    def delete(self, caminho, json=None):
        return requests.delete(self.base_url + caminho, headers=self.auth, json=json, timeout=TIMEOUT)
    # Dados válidos para criar uma criança
    def montar_request_crianca(self, nome, data_nascimento=None, avatar='🦊'):
        # Data que mantém a idade mínima em qualquer dia do ano
        data_nascimento = data_nascimento or datetime.date(datetime.date.today().year - 6, 1, 1)
        return {'nome': nome, 'data_nascimento': data_nascimento.isoformat(), 'avatar': avatar}

    # Criação de criança pelo endpoint real
    def criar_crianca(self, nome):
        resposta = self.post('/api/criancas', json=self.montar_request_crianca(nome))
        self.assertEqual(201, resposta.status_code, resposta.text)
        return resposta.json()

    # Registro de resultado pelo endpoint real
    def criar_resultado(self, crianca_id, enviada, esperada):
        resposta = self.post('/api/resultados', json={
            'crianca_id': crianca_id,
            'atividade_id': self.atividade_id,
            'resposta_enviada': enviada,
            'resposta_esperada': esperada,
        })
        self.assertEqual(201, resposta.status_code, resposta.text)
        return resposta.json()
