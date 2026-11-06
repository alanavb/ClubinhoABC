"""Proteção contra força bruta: bloqueio de tentativas e limite de requisições por IP.

Os limites são reduzidos na configuração do teste para não precisar de centenas de
requisições. O relógio do módulo é simulado para testar o fim do bloqueio sem esperar.
"""

import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Responsavel

TOKEN = {'Authorization': 'Bearer token-de-teste'}
MENSAGEM = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'


class LimiteDeTentativasTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
            'LIMITE_REQUISICOES_POR_MINUTO': 10,
            'LIMITE_FALHAS_AUTENTICACAO': 3,
            'JANELA_FALHAS_SEGUNDOS': 900,
            'TEMPO_BLOQUEIO_SEGUNDOS': 900,
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        db.session.add(Responsavel(supabase_user_id='familia-a', nome='Ana', email='ana@teste.local'))
        db.session.commit()
        self.client = self.app.test_client()

        self.agora = 1000.0
        relogio = patch('app.limite_tentativas._agora', side_effect=lambda: self.agora)
        relogio.start()
        self.addCleanup(relogio.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _com_token_valido(self):
        return patch('app.auth_utils._decodificar_token',
                     return_value={'sub': 'familia-a', 'email': 'ana@teste.local'})

    def _falhar(self, vezes, ip='127.0.0.1'):
        for _ in range(vezes):
            self.client.get('/api/auth/me', environ_base={'REMOTE_ADDR': ip})

    def test_get_authMe_aposMuitasFalhas_deveRetornar429ComMensagemGenerica(self):
        self._falhar(3)

        resposta = self.client.get('/api/auth/me')

        self.assertEqual(429, resposta.status_code)
        self.assertEqual(MENSAGEM, resposta.get_json()['erro'])
        self.assertEqual('901', resposta.headers['Retry-After'])

    def test_get_authMe_comIpBloqueado_deveRetornar429MesmoComTokenValido(self):
        self._falhar(3)

        with self._com_token_valido():
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(429, resposta.status_code)
        self.assertNotIn('email', resposta.get_json())

    def test_get_authMe_depoisDoTempoDeBloqueio_deveVoltarAResponder(self):
        self._falhar(3)
        self.agora += 901

        with self._com_token_valido():
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(200, resposta.status_code)

    def test_get_authMe_comAcessoValidoEntreFalhas_deveZerarAsFalhas(self):
        self._falhar(2)
        with self._com_token_valido():
            self.assertEqual(200, self.client.get('/api/auth/me', headers=TOKEN).status_code)
        self._falhar(2)

        resposta = self.client.get('/api/auth/me')

        self.assertEqual(401, resposta.status_code)

    def test_get_authMe_comIpDiferenteDoBloqueado_naoDeveSerBloqueado(self):
        self._falhar(3, ip='10.0.0.1')

        resposta = self.client.get('/api/auth/me', environ_base={'REMOTE_ADDR': '10.0.0.2'})

        self.assertEqual(401, resposta.status_code)

    def test_api_comMaisRequisicoesQueOLimitePorMinuto_deveRetornar429(self):
        with self._com_token_valido():
            respostas = [self.client.get('/api/auth/me', headers=TOKEN).status_code for _ in range(11)]

        self.assertEqual([200] * 10, respostas[:10])
        self.assertEqual(429, respostas[10])

    def test_api_depoisDeUmMinuto_deveLiberarNovasRequisicoes(self):
        with self._com_token_valido():
            for _ in range(11):
                self.client.get('/api/auth/me', headers=TOKEN)
            self.agora += 61
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(200, resposta.status_code)


if __name__ == '__main__':
    unittest.main()
