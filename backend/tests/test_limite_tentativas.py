# Proteção contra excesso de tentativas e requisições por IP

import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Responsavel

TOKEN = {'Authorization': 'Bearer token-de-teste'}
MENSAGEM = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'


# Testes dos limites de autenticação e requisições
class LimiteDeTentativasTest(unittest.TestCase):

    # Preparação do cliente e limites de teste
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

    # Limpeza do contexto da aplicação
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    # Cabeçalho com token válido
    def _com_token_valido(self):
        return patch('app.auth_utils._decodificar_token',
                     return_value={'sub': 'familia-a', 'email': 'ana@teste.local'})

    # Simulação de falhas de autenticação
    def _falhar(self, vezes, ip='127.0.0.1'):
        for _ in range(vezes):
            self.client.get('/api/auth/me', environ_base={'REMOTE_ADDR': ip})

    # Bloqueio após falhas consecutivas
    def test_get_authMe_aposMuitasFalhas_deveRetornar429ComMensagemGenerica(self):
        self._falhar(3)

        resposta = self.client.get('/api/auth/me')

        self.assertEqual(429, resposta.status_code)
        self.assertEqual(MENSAGEM, resposta.get_json()['erro'])
        self.assertEqual('901', resposta.headers['Retry-After'])

    # IP bloqueado permanece bloqueado com token válido
    def test_get_authMe_comIpBloqueado_deveRetornar429MesmoComTokenValido(self):
        self._falhar(3)

        with self._com_token_valido():
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(429, resposta.status_code)
        self.assertNotIn('email', resposta.get_json())

    # Liberação após o tempo de bloqueio
    def test_get_authMe_depoisDoTempoDeBloqueio_deveVoltarAResponder(self):
        self._falhar(3)
        self.agora += 901

        with self._com_token_valido():
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(200, resposta.status_code)

    # Autenticação válida limpa falhas anteriores
    def test_get_authMe_comAcessoValidoEntreFalhas_deveZerarAsFalhas(self):
        self._falhar(2)
        with self._com_token_valido():
            self.assertEqual(200, self.client.get('/api/auth/me', headers=TOKEN).status_code)
        self._falhar(2)

        resposta = self.client.get('/api/auth/me')

        self.assertEqual(401, resposta.status_code)

    # Bloqueio não afeta outro IP
    def test_get_authMe_comIpDiferenteDoBloqueado_naoDeveSerBloqueado(self):
        self._falhar(3, ip='10.0.0.1')

        resposta = self.client.get('/api/auth/me', environ_base={'REMOTE_ADDR': '10.0.0.2'})

        self.assertEqual(401, resposta.status_code)

    # Limite de requisições por minuto
    def test_api_comMaisRequisicoesQueOLimitePorMinuto_deveRetornar429(self):
        with self._com_token_valido():
            respostas = [self.client.get('/api/auth/me', headers=TOKEN).status_code for _ in range(11)]

        self.assertEqual([200] * 10, respostas[:10])
        self.assertEqual(429, respostas[10])

    # Liberação após a janela de um minuto
    def test_api_depoisDeUmMinuto_deveLiberarNovasRequisicoes(self):
        with self._com_token_valido():
            for _ in range(11):
                self.client.get('/api/auth/me', headers=TOKEN)
            self.agora += 61
            resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(200, resposta.status_code)


if __name__ == '__main__':
    unittest.main()
